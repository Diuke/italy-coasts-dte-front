import { Component, OnInit, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import Draw from 'ol/interaction/Draw'
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Layer, Tile as TileLayer, Vector, Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import { MapServiceService } from '../../services/map-service.service';
import { faBars, faDrawPolygon, faGreaterThan, faLessThan, faEye, faEyeSlash, faChevronDown, faChevronUp, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Polygon from 'ol/geom/Polygon';
import Fill from 'ol/style/Fill';
import { getVectorContext } from 'ol/render';
import { AuthService } from '../../services/auth.service';
import MousePosition from 'ol/control/MousePosition';
import { createStringXY } from 'ol/coordinate';
import { UtilsService } from 'src/app/core/services/utils.service';
import { MediatorService } from 'src/app/core/services/mediator.service';
import { LayerModel } from 'src/app/core/models/layerModel';
import { CopernicusMarineServicesService } from 'src/app/core/services/drivers/copernicus-marine-services.service';
import { GlobalsService } from 'src/app/core/services/globals.service';

@Component({
  selector: 'app-dtemap',
  templateUrl: './dtemap.component.html',
  styleUrls: ['./dtemap.component.scss']
})
export class DTEMapComponent implements OnInit {

  //CONSTANTS
  _faDrawPolygon = faDrawPolygon;
  _faBars = faBars;
  _faLessThan = faLessThan;
  _faGreaterThan = faGreaterThan;
  _faEye = faEye;
  _faEyeSlash = faEyeSlash;
  _faChevronUp = faChevronUp;
  _faChevronDown = faChevronDown;
  _faInfoCircle = faInfoCircle;

  NO_AOI = 0;
  DRAWING_AOI = 1;
  SELECTED_AOI = 2;

  CONTEXT_NOT_SET = 0;
  CONTEXT_SET = 1;

  NOT_CAPTURING_POINT = 0;
  CAPTURING_POINT = 1;

  LAND_10KM_SEA_12NM = 1;
  LAND_10KM_SEA_ALL = 2;

  /** Variable to control when the layers are fully loaded */
  loadingLayers: boolean = true;
  isLoggedIn: boolean;
  loading: boolean = false;

  /** List of available layers with given contextual parameters */
  wmsLayers: any[] = [];
  wfsLayers: any[] = [];

  /** List of layers from the api */
  listOfLayersWMS: any[];
  listOfLayersWFS: any[];

  listOfSelectedLayers: any[] = [];

  layerMap: { [id: number]: { data: LayerModel, layer: Layer<any>, expanded: boolean, visible: boolean, opacity: number, params: [], paramsObject: {[key: string]: { values: string[], default: string, selected: string }} } } = {};

  limitLayer12NM: VectorLayer<any>;
  limitLayerAll: VectorLayer<any>;

  sidebarOpen: boolean = true;

  public map: Map;
  mapCenter = fromLonLat([12.489947, 41.902540]); //Centered in Rome
  mapInitialZoom = 6.5;

  //Area of interest variables
  //3 states - No area selected = 0, Drawing = 1, Area selected = 2
  aoiState = this.NO_AOI;

  //Context variables
  //2 states - Context not set = 0, Context set = 1
  contextState = this.CONTEXT_NOT_SET;

  aoiPolygonDraw: Draw;
  aoiSource: VectorSource<Polygon> = new VectorSource({ wrapX: false });
  aoiVectorLayer: VectorLayer<VectorSource<Polygon>>;

  aoi_BBOX: any[] = [];

  //Value of the selected limit form control
  selectedLimit: number = 1;
  activeBoundaryLayer: VectorLayer<VectorSource<Polygon>>;

  //Values of the date range form controls
  dateFrom: string = "2018-01-01";
  dateTo: string = "2021-11-01";

  layersHierarchy: any[] = [];

  captureState: number = this.NOT_CAPTURING_POINT;

  constructor(
    private mapService: MapServiceService,
    private authService: AuthService,
    private mediator: MediatorService,
    public globals: GlobalsService,
    private utils: UtilsService,

    private driver: CopernicusMarineServicesService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.initMap();
    this.initStaticLayers()
    //this.fetchLayerList();
    this.initLayerEvents();
    //this.initLayers();
  }

  initMap() {
    this.aoiVectorLayer = new VectorLayer({
      source: this.aoiSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgb(0.0, 0.0, 255)',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(0.0, 0.0 ,0.0 ,0.0)',

        })
      })
    });

    this.map = new Map({
      view: new View({
        center: this.mapCenter,
        zoom: this.mapInitialZoom,
        projection: "EPSG:3857"
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.aoiVectorLayer
      ],
      target: 'map'
    });

  }

  initLayerEvents() {
    this.map.on('singleclick', (evt) => {

      if (this.captureState == this.CAPTURING_POINT) {
        this.captureState = this.NOT_CAPTURING_POINT;
        let mapResolution = this.map.getView().getResolution();
        let visibleLayers = this.layerMap;
        for (const [key, value] of Object.entries(visibleLayers)) {
          if (value.visible) {
            let url = value.layer.getSource().getFeatureInfoUrl(
              evt.coordinate,
              mapResolution,
              'EPSG:3857',
              { 'INFO_FORMAT': 'text/xml' }
            );
            if (url) {

              fetch(url)
                .then((response) => response.text())
                .then((data) => {
                  console.log(data);
                });
            }
          }
        }
      }
    });

    this.map.on('pointermove', (evt) => {
      this.map.getViewport().style.cursor = this.captureState == this.CAPTURING_POINT ? 'crosshair' : 'default';
    });

    const mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(4),
      projection: 'EPSG:4326',
      className: 'mouse-position',
      target: "mouse-position"
    });

    this.map.addControl(mousePositionControl);
  }

  initStaticLayers() {
    let limitStyle = new Style({
      fill: new Fill({
        color: 'transparent',
      }),
      stroke: new Stroke({
        color: "#3495eb",
      })
    });

    this.limitLayer12NM = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: 'assets/gis/limits/land10km_water12nm.geojson',
      }),
      style: limitStyle,
      opacity: 1,
      visible: true
    })

    this.limitLayerAll = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: 'assets/gis/limits/land10km_waterAll.geojson',
      }),
      style: limitStyle,
      opacity: 1,
      visible: false
    });


    this.map.addLayer(this.limitLayer12NM);
    this.map.addLayer(this.limitLayerAll);
  }

  hierarchyToList(hierarchy: any[]): any[] {
    let layerList: any[] = [];
    hierarchy.forEach(element => {
      layerList = layerList.concat(element.layers);
    });
    return layerList
  }

  fetchLayerList() {
    this.mapService.getLayerHierarchy(this.dateFrom, this.dateTo)
      .then(response => response.json())
      .then(data => {
        this.layersHierarchy = data;
        this.listOfLayersWMS = this.hierarchyToList(this.layersHierarchy);
        this.initLayers();
      });

    //this.mapService.getLayersWMS()
    //  .then(response => response.json())
    //  .then(data => {
    //    let apiLayersWMS = new LayerConfig(data);
    //    this.listOfLayersWMS = apiLayersWMS;
    //  });


  }

  initWMSLayers() {
    let style = new Style({
      fill: new Fill({
        color: 'black',
      }),
    });
    let aoiLayer = this.aoiVectorLayer;

    for (let i = 0; i < this.listOfLayersWMS.length; i++) {
      if(this.listOfLayersWMS[i].parameters == ""){
        this.listOfLayersWMS[i].parameters = [];
      } else {
        this.listOfLayersWMS[i].parameters = this.listOfLayersWMS[i].parameters.split(",");
      }
      
      let layerData = this.listOfLayersWMS[i];
      let parameters = layerData.parameters;
      
      let frequency = layerData.frequency == null ? "" : layerData.frequency;

      let layerParams: any = {
        'TILED': true,
        'LAYERS': layerData.layer_name,
        'BBOX': this.aoi_BBOX.toString(),
        'CRS': "EPSG:4326"
      };
      
      let layer = new TileLayer({
        source: new TileWMS({
          url: layerData.service_url,
          params: layerParams,
          transition: 0,
        }),
        visible: false
      });

      layer.setExtent(aoiLayer.getSource().getExtent());
      layer.on('postrender', (e: any) => {
        const vectorContext = getVectorContext(e);
        e.context.globalCompositeOperation = 'destination-in';

        this.activeBoundaryLayer.getSource().forEachFeature((feature) => {
          vectorContext.drawFeature(feature, style);
        });
        aoiLayer.getSource().forEachFeature((feature) => {
          vectorContext.drawFeature(feature, style);
        });
        e.context.globalCompositeOperation = 'source-over';
      });

      this.wmsLayers.push(layer);

      this.layerMap[layerData.id] = {
        data: layerData,
        layer: layer,
        visible: false,
        expanded: true,
        opacity: 100,
        params: parameters,
        paramsObject: {}
      }

      this.map.addLayer(layer);
    }
  }

  initWFSLayers() {
    //for all vector (WFS) layers do this:
    for (let i = 0; i < this.listOfLayersWFS.length; i++) {
      let layerData = this.listOfLayersWFS[i];
    }
    const vectorSource = new VectorSource();
    const vector = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(0, 0, 255, 1.0)',
          width: 2,
        }),
      }),
    });

    fetch("https://ows.emodnet-humanactivities.eu/wfs?SERVICE=WFS&VERSION=1.1.0&request=GetFeature&typeName=maritimebnds&OUTPUTFORMAT=json&maxfeatures=1", {
      method: "GET"
    })
      .then(resp => {
        return resp.json();
      })
      .then(data => {
        const features = new GeoJSON().readFeatures(data);
        vectorSource.addFeatures(features);
        this.map.getView().fit(vectorSource.getExtent());

        const vector = new VectorLayer({
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(0, 0, 255, 1.0)',
              width: 2,
            }),
          }),
          properties: {
            cross_origin: 'null'
          }

        });
        this.map.addLayer(vector);
      });
  }

  async initLayers() {
    this.loadingLayers = true;

    //await this.initWFSLayers();
    await this.initWMSLayers();
    this.loadingLayers = false;
  }

  toggleDrawingAOI() {
    if (this.aoiState == this.SELECTED_AOI) {
      this.aoiState = this.NO_AOI;
      this.deactivateDrawingAOI();
    } else if (this.aoiState == this.NO_AOI) {
      this.aoiState = this.DRAWING_AOI;
      this.activateDrawingAOI();
    } else if (this.aoiState == this.DRAWING_AOI) {
      this.aoiState = this.NO_AOI;
      this.deactivateDrawingAOI();
    }
  }

  /**
   * This function is called when the Draw Area of Interest is clicked.
   * This adds the interaction and creates the listener to trigger when the user finishes selecting the area of interest.
   */
  activateDrawingAOI() {
    this.aoiPolygonDraw = new Draw({
      source: this.aoiSource,
      type: "Polygon",
    });
    this.map.addInteraction(this.aoiPolygonDraw);
    this.aoiVectorLayer.setZIndex(999);
    this.aoiVectorLayer.getSource().on('addfeature', (event) => {
      //Create any other functionality when the drawing is finished.
      this.finishPolygonAOI();
    });
  }

  /**
   * To be called when the drawing of the AOI polygon is finished. 
   * Add here all the specific functionality.
   */
  finishPolygonAOI() {
    this.aoiState = this.SELECTED_AOI;
    if (this.selectedLimit == this.LAND_10KM_SEA_12NM) {
      this.activeBoundaryLayer = this.limitLayer12NM
    } else {
      this.activeBoundaryLayer = this.limitLayerAll;
    }
    this.aoiPolygonDraw.abortDrawing();
    this.map.removeInteraction(this.aoiPolygonDraw);
  }

  /**
   * Called when the Reset Area of Interest button is pressed.
   * Restarts the AOI layer, stops the drawing and removes the Draw interaction.
   * TODO: add confirmation for reseting AOI.
   */
  deactivateDrawingAOI() {
    this.aoiPolygonDraw.abortDrawing();
    this.aoiVectorLayer.getSource().clear();
    this.map.removeInteraction(this.aoiPolygonDraw);
    this.wfsLayers.forEach((element) => {
      this.map.removeLayer(element);
    });
    this.wmsLayers.forEach((element) => {
      this.map.removeLayer(element);
    });
    this.loadingLayers = true;

  }

  toggleLayerVisibility(layerId: number) {
    this.layerMap[layerId].visible = !this.layerMap[layerId].visible;
    this.layerMap[layerId].layer.setVisible(this.layerMap[layerId].visible);
  }

  toggleLayerExpanded(layerId: number){
    this.layerMap[layerId].expanded = !this.layerMap[layerId].expanded;
  }

  setLayerParameter(layerId: number){
    let layer = this.layerMap[layerId];
    let layerSource: TileWMS = layer.layer.getSource();
    let parameters = layerSource.getParams();

    layer.params.forEach((param: string) => {
      parameters[param] = layer.paramsObject[param].selected;
    });

    layerSource.updateParams(parameters);
  }

  setLayerOpacity(layerId: number, opacity: number) {
    let layer = this.layerMap[layerId];
    let newOpacity = opacity / 100;
    layer.layer.setOpacity(newOpacity);
  }

  openInfoLayer(layerId: number){

  }

  openSidebar() {
    this.sidebarOpen = true;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  changeSelectedLimit() {
    if (this.selectedLimit == this.LAND_10KM_SEA_12NM) {
      this.limitLayer12NM.setVisible(true);
      this.limitLayerAll.setVisible(false);
    } else {
      this.limitLayer12NM.setVisible(false);
      this.limitLayerAll.setVisible(true);
    }
  }

  validateContext(): boolean {
    console.log(this.dateFrom, this.dateTo);
    
    if(this.dateFrom == "" || this.dateTo == ""){
      return false;
    }
    if(this.aoiState != this.SELECTED_AOI){
      return false;
    }
    return true;
  }

  setContext() {
    let valid = this.validateContext();
    if (valid) {
      this.contextState = this.CONTEXT_SET;
      this.fetchLayerList();
      this.aoi_BBOX = this.aoiSource.getExtent();

      let startDateSplit = this.dateFrom.split("-");
      let endDateSplit = this.dateTo.split("-");
      this.globals.contextStartDate = new Date(parseInt(startDateSplit[0]), parseInt(startDateSplit[1])-1, parseInt(startDateSplit[2]));
      this.globals.contextEndDate = new Date(parseInt(endDateSplit[0]), parseInt(endDateSplit[1])-1, parseInt(endDateSplit[2])); 
      
    }
  }

  capturePoint() {
    this.captureState = this.CAPTURING_POINT;
  }

  cancelCapturePoint() {
    this.captureState = this.NOT_CAPTURING_POINT;
  }

  resetContext() {
    this.contextState = this.CONTEXT_NOT_SET;
    this.listOfLayersWFS = [];
    this.listOfLayersWFS = [];
    this.listOfSelectedLayers = [];
    this.layerMap = {};
    this.layersHierarchy = [];
    this.dateFrom = "";
    this.dateTo = "";
    this.selectedLimit = 1;
    this.aoiState = this.NO_AOI;
    this.aoi_BBOX = [];
    this.deactivateDrawingAOI();
  }

  initLayerParameters(layer: any){    
    let _layer = this.layerMap[layer.data.id];
    this.loading = true;
    let layerSource: TileWMS = _layer.layer.getSource();
    let updatedLayerParams: any = layerSource.getParams();
    let paramsToLoad = 0;
    if(layer.params != ""){
      paramsToLoad = layer.params.length;
    }

    if(paramsToLoad == 0) this.loading = false;
    let loadedParams = 0;
    for(let i = 0; i < layer.params.length; i++){
      let paramName = layer.params[i];
      //Preallocate to avoid console warnings
      layer.paramsObject[paramName] = {
        default: "",
        values: [],
        selected: ""
      };

      let globalStartDate = this.globals.contextStartDate;
      let globalEndDate = this.globals.contextEndDate;
      this.mediator.getDimensionValues(_layer.data, paramName)?.subscribe((param_object: any) => {
        let values = param_object["values"];
        if(paramName == "time"){
          values = this.utils.cropListOfDates(globalStartDate, globalEndDate, param_object["values"]);
        }
        
        //format = { default: string, units: string, name: string, values: list

        layer.paramsObject[paramName] = {
          default: param_object["default"],
          values: values,
          selected: values[0]
        };
        layerSource.updateParams(updatedLayerParams);
        updatedLayerParams[paramName] = layer.paramsObject[paramName].selected;

        loadedParams++;
        this.loading = loadedParams < paramsToLoad;
      }, (error: any) => {
        loadedParams++;
        this.loading = loadedParams < paramsToLoad;
      }); 
    }
  }

  handleLayerManipulation(data: { id: number, event: string, value: any }) {
    if (data.event == "visibility") {
      this.toggleLayerVisibility(data.id);
    }
    else if (data.event == "opacity") {
      this.setLayerOpacity(data.id, data.value);
    }
    else if (data.event == "selected") {
      let layer = this.layerMap[data.id];
      if (this.listOfSelectedLayers.includes(layer)) {
        let index = this.listOfSelectedLayers.indexOf(layer);
        this.listOfSelectedLayers.splice(index, 1);
        //Reset the layer in the model
        layer.layer.setVisible(false);
        layer.layer.setOpacity(1);
        layer.visible = false;
        layer.opacity = 100;      
      } else {
        layer.layer.setVisible(true);
        layer.visible = true;
        layer.expanded = true;
        this.initLayerParameters(layer);
        this.listOfSelectedLayers.push(layer);
      }
    }
    
  }
}
