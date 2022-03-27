import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import WMTS, { optionsFromCapabilities } from  'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import TileWMS from 'ol/source/TileWMS';
import Draw from 'ol/interaction/Draw'
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import { MapServiceService } from '../../services/map-service.service';
import { faBars, faDrawPolygon, faGreaterThan, faLessThan, faEye, faEyeSlash, faChevronDown, faChevronUp, faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import Polygon from 'ol/geom/Polygon';
import Fill from 'ol/style/Fill';
import { getVectorContext } from 'ol/render';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/core/services/utils.service';
import { MediatorService } from 'src/app/core/services/mediator.service';
import { GlobalsService } from 'src/app/core/services/globals.service';
import { MapLayerModel } from 'src/app/core/models/mapLayerModel';
import ImageLayer from 'ol/layer/Image';
import ScaleLine from 'ol/control/ScaleLine';
import { defaults as defaultControls } from 'ol/control';
import { Coordinate } from 'ol/coordinate';
import { Overlay } from 'ol';
import { AnalysisUnitComponent } from '../analysis-unit/analysis-unit.component';
import { ApplicationState, ScenarioModel } from 'src/app/core/models/applicationState';
import { SharingService } from 'src/app/core/services/sharing.service';

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
  _faTrash = faTrash;

  scaleLineControl = new ScaleLine();

  NO_AOI = 0;
  DRAWING_AOI = 1;
  SELECTED_AOI = 2;

  CONTEXT_NOT_SET = 0;
  CONTEXT_SET = 1;

  NOT_CAPTURING_POINT = 0;
  CAPTURING_POINT = 1;

  LAND_10KM_SEA_12NM = 1;
  LAND_10KM_SEA_ALL = 2;

  OSM_BASEMAP = 1;
  SATELLITE_BASEMAP = 2;

  loadingScenario: boolean = false;

  /**Variable for building the EOX Sentinel-2 cloudless base map from the WMTS Capabilities */
  parser = new WMTSCapabilities();

  /** Variable to control when the layers are fully loaded */
  loadingLayers: boolean = false;
  isLoggedIn: boolean;
  loading: boolean = false;

  /** List of available layers with given contextual parameters */
  wmsLayers: any[] = [];
  wfsLayers: any[] = [];

  /** List of layers from the api */
  listOfLayersWMS: any[] = [];
  listOfLayersWFS: any[] = [];

  listOfSelectedLayers: MapLayerModel[] = [];

  layerMap: { [id: number]: MapLayerModel } = {};

  limitLayer12NM: VectorLayer<any>;
  limitLayerAll: VectorLayer<any>;

  sidebarLeftOpen: boolean = true;
  sidebarRightOpen: boolean = false;

  public map: Map;
  mapCenter = fromLonLat([15.589947, 41.902540]); //Centered in Rome
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
  selectedLimit: number = this.LAND_10KM_SEA_ALL;
  activeBoundaryLayer: VectorLayer<VectorSource<Polygon>> | null;

  //Values of the date range form controls
  dateFrom: string = "2020-04-01"; //"2018-01-01";
  dateTo: string = "2020-10-01";//"2021-11-01";

  //ngModel of the select to pick the basemap.
  basemapSelect: number = this.OSM_BASEMAP; 

  osmBasemap = new TileLayer({
    source: new OSM(),
    zIndex: 0
  });

  satelliteBasemap: TileLayer<WMTS>;

  layersHierarchy: any[] = [];
  displayLayersHierarchy: any[] = [];

  captureState: number = this.NOT_CAPTURING_POINT;

  @ViewChildren(AnalysisUnitComponent) analysisUnitComponent: QueryList<AnalysisUnitComponent>;
  analysisUnits: any[] = [];

  layerFilter: string = "";
  loadingFilter: boolean = false;

  userScenarios: ScenarioModel[] = [];

  //Popup variables
  dataPreviewPopup: HTMLElement;
  dataPreviewPopupContent: Array<any>;
  dataPreviewPopupCloser: HTMLElement;
  dataPreviewOverlay: Overlay;
  loadingClickPopupValues: boolean = false;

  constructor(
    private mapService: MapServiceService,
    private authService: AuthService,
    private mediator: MediatorService,
    public globals: GlobalsService,
    private utils: UtilsService,
    private sharingService: SharingService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.initMap();
    this.initStaticLayers();
    //this.fetchLayerList();
    this.initLayerEvents();
    //this.initLayers();
    if(this.isLoggedIn){
      this.loadScenariosList();
    }
  }

  createAnalysisUnit(){
    //Create an empty analysis
    this.analysisUnits.push(null);
  }

  removeAnalysisHandler(unitIndex: number){
    this.deleteAnalysisUnit(unitIndex)
  }

  deleteAnalysisUnit(index: number){
    this.analysisUnits.splice(index, 1);
  }
  
  initMap() {
    this.dataPreviewPopup = document.getElementById("dataPreviewPopup")!;
    this.dataPreviewPopupContent = [];
    this.dataPreviewPopupCloser = document.getElementById("popup-closer")!;
    this.dataPreviewOverlay = new Overlay({
      element: this.dataPreviewPopup ? this.dataPreviewPopup : undefined, //works like this for some reason...
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });

    this.aoiVectorLayer = new VectorLayer({
      source: this.aoiSource,
      zIndex: 20,
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
        this.aoiVectorLayer,
        this.osmBasemap,
      ],
      overlays: [
        this.dataPreviewOverlay
      ],
      target: 'map',
      controls: defaultControls({attribution: true, zoom: true}).extend([this.scaleLineControl]),
    });
    this.mapService.setMap(this.map);

    //To adjust the margin that is set by the left sidebar
    this.resizeMap();

    //Satellite basemap WMTS layer
    fetch("https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml")
    .then((response) => {
      return response.text();
    })
    .then((text) => {
      const result = this.parser.read(text);
      let options = optionsFromCapabilities(result, {
        layer: 's2cloudless-2020_3857_512',
        matrixSet: 'EPSG:3857'
      });
      options.attributions =  "Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2020)";
      this.satelliteBasemap = new TileLayer({
        opacity: 1,
        source: new WMTS(options),
        visible: false,
        zIndex: 0
      });
      this.map.addLayer(this.satelliteBasemap);
    });

  }

  initLayerEvents() {
    this.map.on('pointermove', (evt) => {
      this.map.getViewport().style.cursor = this.captureState == this.CAPTURING_POINT ? 'crosshair' : 'default';
    });

    this.map.on('singleclick', (evt) => { 
      if (!this.mapService.capturingAnalysisPoint && this.contextState ==  this.CONTEXT_SET) {

        //Check if the clicked point is inside AOI
        if(this.aoiSource.getFeatures()[0].getGeometry().intersectsCoordinate(evt.coordinate)){
          this.loadingClickPopupValues = true;
          this.dataPreviewPopupContent = [];
          this.openPopup(evt.coordinate);
          if(this.listOfSelectedLayers.length === 0){
            this.dataPreviewPopupContent = [{layer: "", value:"No active layers"}];
          } else {
            let params: any = {};
            for(let layer of this.listOfSelectedLayers){
              for(let i in layer.params){
                params[layer.params[i]] = layer.paramsObject[layer.params[i]].selected;
              }
              this.mediator.getData(layer, this.map.getView().getResolution(), evt.coordinate, params).then(data => {
                this.dataPreviewPopupContent.push(
                  {layer: layer.data.readable_name + ": ", value: data.value + " " + data.units}
                );
              });
              
            }
            this.loadingClickPopupValues = false;
          }
        }
      }
    });
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
      visible: false,
      zIndex: 10
    })

    this.limitLayerAll = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: 'assets/gis/limits/land10km_waterAll.geojson',
      }),
      style: limitStyle,
      opacity: 1,
      visible: true,
      zIndex: 10
    });


    this.map.addLayer(this.limitLayer12NM);
    this.map.addLayer(this.limitLayerAll);
  }

  hierarchyToList(hierarchy: any[]): any[] {
    let layerList: any[] = [];
    hierarchy.forEach(element => {
      layerList = layerList.concat(element.layers);
    });
    return layerList;
  }

  async fetchLayerList() {
    this.loadingLayers = true;
    let promise = this.mapService.getLayerHierarchy(this.dateFrom, this.dateTo).toPromise();
    if(this.loadingScenario){
      await promise.then((data: any) => {
        this.layersHierarchy = data;
        this.displayLayersHierarchy = data;
        this.listOfLayersWMS = this.hierarchyToList(this.layersHierarchy);
        this.initLayers();
        this.loadingLayers = false;
      });
    } else {
      promise.then((data: any) => {
        this.layersHierarchy = data;
        this.displayLayersHierarchy = data;
        this.listOfLayersWMS = this.hierarchyToList(this.layersHierarchy);
        this.initLayers();
        this.loadingLayers = false;
      });
    }
    console.log("loaded layers");
    
  }

  importShapefile(){

  }

  initWMSLayers() {
    let style = new Style({
      fill: new Fill({
        color: 'black',
      }),
    });
    let aoiLayer = this.aoiVectorLayer;

    for (let i = 0; i < this.listOfLayersWMS.length; i++) {
      let layerData = this.listOfLayersWMS[i];

      if(this.listOfLayersWMS[i].parameters == ""){
        this.listOfLayersWMS[i].parameters = [];
      } else {
        this.listOfLayersWMS[i].parameters = this.listOfLayersWMS[i].parameters.split(",");
      }
      
      let parameters = layerData.parameters;

      let layerParams: any = null;
      let layer: any = null;

      //Non-landcover layers are on top
      let zIndex = layerData.category.name == "Landcover" ? 100 : 101;

      if(layerData.type == "ARCGIS_IS" || layerData.type == "ARCGIS_MS"){
        layerParams = {
          'TILED': true,
          'LAYERS': layerData.layer_name,
          'BBOX': this.aoi_BBOX.toString(),
          'CRS': "EPSG:4326"
        };

        layer = new ImageLayer({
          source: new ImageArcGISRest({
            ratio: 1,
            params: layerParams,
            url: layerData.service_url,
          }),
          visible: false,
          zIndex: zIndex
        });


      } else if(layerData.type == "WMS"){
        layerParams = {
          'TILED': true,
          'LAYERS': layerData.layer_name,
          'BBOX': this.aoi_BBOX.toString(),
          'CRS': "EPSG:4326"
        };

        layer = new TileLayer({
          source: new TileWMS({
            url: layerData.service_url,
            params: layerParams,
          }),
          visible: false,
          zIndex: zIndex
        });
      }

      layer.setExtent(aoiLayer.getSource().getExtent());
      layer.on('postrender', (e: any) => {
        const vectorContext = getVectorContext(e);
        e.context.globalCompositeOperation = 'destination-in';
        if(this.activeBoundaryLayer){
          this.activeBoundaryLayer.getSource().forEachFeature((feature) => {
            vectorContext.drawFeature(feature, style);
          });
        }
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
    //await this.initWFSLayers();
    await this.initWMSLayers();
    //await this.initArcGISLayers();
    this.mapService.layerMap = this.layerMap;
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
    } else if(this.selectedLimit == this.LAND_10KM_SEA_ALL) {
      this.activeBoundaryLayer = this.limitLayerAll;
    } else {
      this.activeBoundaryLayer = null;
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
    if(this.aoiPolygonDraw){
      this.aoiPolygonDraw.abortDrawing();
      this.aoiVectorLayer.getSource().clear();
      this.map.removeInteraction(this.aoiPolygonDraw);
      this.wfsLayers.forEach((element) => {
        this.map.removeLayer(element);
      });
      this.wmsLayers.forEach((element) => {
        this.map.removeLayer(element);
      });
      //this.loadingLayers = true;
    }
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

  resizeMap(){  
    setTimeout( () => { this.map.updateSize();} , 10);
  }

  openLeftSidebar() {
    this.sidebarLeftOpen = true;
    this.resizeMap();
  }

  closeLeftSidebar() {
    this.sidebarLeftOpen = false;
    this.resizeMap();
  }

  toggleLeftSidebar() {
    this.sidebarLeftOpen = !this.sidebarLeftOpen;
    this.resizeMap();
  }

  openRightSidebar() {
    this.sidebarRightOpen = true;
    this.resizeMap();
  }

  closeRightSidebar() {
    this.sidebarRightOpen = false;
    this.resizeMap();
  }

  toggleRightSidebar() {
    this.sidebarRightOpen = !this.sidebarRightOpen;
    this.resizeMap();
  }

  changeSelectedLimit() {
    if (this.selectedLimit == this.LAND_10KM_SEA_12NM) {
      this.limitLayer12NM.setVisible(true);
      this.limitLayerAll.setVisible(false);
    } else if (this.selectedLimit == this.LAND_10KM_SEA_ALL) {
      this.limitLayer12NM.setVisible(false);
      this.limitLayerAll.setVisible(true);
    } else {
      this.limitLayer12NM.setVisible(false);
      this.limitLayerAll.setVisible(false);
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

  async setContext() {
    let valid = this.validateContext();
    if (valid) {
      this.contextState = this.CONTEXT_SET;
      this.aoi_BBOX = this.aoiSource.getExtent();
      this.globals.bbox = this.aoi_BBOX;
      this.globals.areaOfInterest = this.aoiSource;
      this.zoomToAOI();  

      document.getElementById("nav-selection-tab")?.classList.add('active');
      document.getElementById("nav-context-tab")?.classList.remove('active');
      document.getElementById("nav-context")?.classList.remove('show', 'active');
      document.getElementById("nav-selection")?.classList.add('show', 'active');     
      this.openRightSidebar();

      let startDateSplit = this.dateFrom.split("-");
      let endDateSplit = this.dateTo.split("-");
      this.globals.contextStartDate = new Date(parseInt(startDateSplit[0]), parseInt(startDateSplit[1])-1, parseInt(startDateSplit[2]));
      this.globals.contextEndDate = new Date(parseInt(endDateSplit[0]), parseInt(endDateSplit[1])-1, parseInt(endDateSplit[2])); 

      if(this.loadingScenario){
        await this.fetchLayerList();
      } else {
        this.fetchLayerList();
      }
    }
  }

  zoomToAOI(){
    let feature = this.aoiSource.getFeatures()[0];
    let polygon = feature.getGeometry();
    this.map.getView().fit(polygon, {
      duration: 1000,
      padding: [10, 300, 10, 300]
    });
  }

  capturePoint() {
    this.captureState = this.CAPTURING_POINT;
  }

  cancelCapturePoint() {
    this.captureState = this.NOT_CAPTURING_POINT;
  }

  resetContext() {
    for(let layerToRemove of Object.entries(this.layerMap)){
      this.map.removeLayer(layerToRemove[1].layer);
    }
    this.contextState = this.CONTEXT_NOT_SET;
    this.aoiSource.clear();
    this.listOfLayersWFS = [];
    this.listOfLayersWFS = [];
    this.listOfSelectedLayers = [];
    this.layerMap = {};
    this.layersHierarchy = [];
    this.displayLayersHierarchy = [];
    this.dateFrom = "";
    this.dateTo = "";
    this.aoiState = this.NO_AOI;
    this.globals.bbox = [];
    this.globals.areaOfInterest = null;
    this.aoi_BBOX = [];
    this.loadingLayers = false;
    this.analysisUnits = [];
    this.deactivateDrawingAOI();
  }

  setGlobalDate(){

  }

  async initLayerParameters(layer: any){    
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
      if(this.loadingScenario){

      }
      let getDimensionPromise = this.mediator.getDimensionValues(_layer.data, paramName)?.toPromise();
      if(this.loadingScenario){
        await getDimensionPromise?.then((param_object: any) => {
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
        }, error => {
          loadedParams++;
          this.loading = loadedParams < paramsToLoad;
        });
      } else {
        getDimensionPromise?.then((param_object: any) => {
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
        }, error => {
          loadedParams++;
          this.loading = loadedParams < paramsToLoad;
        });
      }
    }
  }

  changeBasemap(){
    if(this.basemapSelect == this.OSM_BASEMAP){
      this.osmBasemap.setVisible(true);
      this.satelliteBasemap.setVisible(false);
    } else {
      this.osmBasemap.setVisible(false);
      this.satelliteBasemap.setVisible(true);
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

  filterLayers(){
    //Create hard copy of layer hierarcy
    this.loadingFilter = true;
    let filteredLayers = JSON.parse(JSON.stringify(this.layersHierarchy));
    let filterName = this.layerFilter.toUpperCase();
    for(let element of filteredLayers){
      let layers = element["layers"].filter((layer: any) => {        
        return layer.readable_name.toUpperCase().includes(filterName);
      })
      element.layers = layers;
    }
    this.displayLayersHierarchy = filteredLayers;   
    this.loadingFilter = false; 
  }

  openPopup(coordinates: Coordinate){
    this.dataPreviewOverlay.setPosition(coordinates);
  }

  closePopup(){
    this.dataPreviewOverlay.setPosition(undefined!);
    this.dataPreviewPopupCloser?.blur();
  }

  generateApplicationState(){
    let sharingObject: ApplicationState = {
      context: {
        areaOfInterest: this.sharingService.buildGeoJsonString(this.aoiSource),
        basemap: this.basemapSelect,
        startDate: this.dateFrom,
        endDate: this.dateTo,
        limits: this.selectedLimit
      },

      layers: Object.values(this.listOfSelectedLayers).map((element) => {
        return {
          id: element.data.id,
          expanded: element.expanded,
          opacity: element.opacity,
          visible: element.visible,
          params: Object.keys(element.paramsObject).map(paramKey => {
            return {
              name: paramKey, 
              value: element.paramsObject[paramKey].selected
            };
          })
        };
      }),

      analysisUnits: this.analysisUnitComponent.map(analysisUnit => {
        return {
          layerIds: analysisUnit.layers.map(layerElement => {return layerElement.model.data.id}),
          name: analysisUnit.analysisName,
          analysisType: analysisUnit.typeSelector.toString(),
          coordinates: analysisUnit.pointCoordinates,
          samplingResolution: analysisUnit.samplingSelector.toString(),
          histogramClasses: analysisUnit.histogramClasses.toString(),
          analysisPerformed: analysisUnit.doneAnalysis,
          expanded: analysisUnit.expanded
        };
      })
    };
    return sharingObject;
  }

  uploadAplicationStateFile(files: any){
    let file = files[0];
    console.log(file);
    
    if (file) {
      var reader = new FileReader();
      let state: ApplicationState | null;
      reader.readAsText(file, "UTF-8");
      reader.onload = (evt: any) => {
        state = JSON.parse(evt.target.result);
        this.loadApplicationState(state!);
      }
      reader.onerror = (error) => {
        state = null;
        console.log('error reading file');
      }
    }
  }

  async loadApplicationState(state: ApplicationState){
    try {      
      //Remove everything before starting.
      this.resetContext();
      this.loadingScenario = true;

      //let state = this.sharingService.exampleScenario;
      this.basemapSelect = state!.context.basemap;
      this.dateFrom = state!.context.startDate;
      this.dateTo = state!.context.endDate;
      this.selectedLimit = state!.context.limits
      this.aoiSource =  new VectorSource({
        features: new GeoJSON().readFeatures(state!.context.areaOfInterest)
      })
      this.aoiState = this.SELECTED_AOI;
      this.aoiVectorLayer.setSource(this.aoiSource);
      this.aoiVectorLayer.setVisible(true);
      await this.setContext();

      this.listOfSelectedLayers = [];
      for(let scenarioLayer of state!.layers){
        let layer = this.layerMap[scenarioLayer.id];
        layer.expanded = scenarioLayer.expanded;
        layer.visible = scenarioLayer.visible;
        layer.layer.setVisible(layer.visible);
        layer.opacity = scenarioLayer.opacity;
        layer.layer.setOpacity(layer.opacity);      
        await this.initLayerParameters(layer);
        for(let param of scenarioLayer.params){
          layer.paramsObject[param.name].selected = param.value;
        }
        console.log("loaded", scenarioLayer);
        
        this.listOfSelectedLayers.push(layer);
      }
      console.log("finished loading layers");
      
      this.analysisUnits = state!.analysisUnits;  
      this.loadingScenario = false;   
    } catch (error) {
      this.resetContext();
      this.loadingScenario = false;  
      console.log('Error loading scenario');
    }
  }

  saveScenario(){
    let scenarioJson = JSON.stringify(this.generateApplicationState());
    this.sharingService.createScenario("New Scenario", scenarioJson).subscribe((data: any) => {
      console.log("Your scenario was created!");
      this.loadScenariosList();
    });
  }

  deleteScenario(scenario: ScenarioModel){
    this.sharingService.deleteScenario(scenario.id).subscribe(data => {
      console.log(data);
      this.loadScenariosList();
    })
  }

  downloadScenario(){
    let sharingObject = this.generateApplicationState();
    let a = document.createElement('a');
    document.body.appendChild(a);
    const blob = new Blob([JSON.stringify(sharingObject)], { type: 'application/json' });
    const url= window.URL.createObjectURL(blob);
    let filename = "Scenario.json";

    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
    
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  loadScenariosList(){
    this.sharingService.loadUserScenarios().subscribe((data: any) => {
      console.log(data);
      this.userScenarios = data;
    });
  }

  applyScenario(scenario: ScenarioModel){
    let scenarioObject = JSON.parse(scenario.scenario_json);
    this.loadApplicationState(scenarioObject);
  }
}
