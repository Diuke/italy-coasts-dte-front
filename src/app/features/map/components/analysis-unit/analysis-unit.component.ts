import { Component, Input, OnDestroy, OnInit, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { MapLayerModel } from 'src/app/core/models/mapLayerModel';
import { MediatorService } from 'src/app/core/services/mediator.service';
import { MapServiceService } from '../../services/map-service.service';
import { transform } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import { faChevronDown, faChevronUp, faFileExport, faExpandArrowsAlt, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GlobalsService } from 'src/app/core/services/globals.service';
import GeoJSON from 'ol/format/GeoJSON';
import { UtilsService } from 'src/app/core/services/utils.service';
import { AnalysisUnitState } from 'src/app/core/models/applicationState';

@Component({
  selector: 'app-analysis-unit',
  templateUrl: './analysis-unit.component.html',
  styleUrls: ['./analysis-unit.component.scss']
})
export class AnalysisUnitComponent implements OnInit, OnDestroy {
  _faTrash = faTrash;
  _faChevronUp = faChevronUp;
  _faChevronDown = faChevronDown;
  _faTimes = faTimes;
  _faExpandArrowsAlt = faExpandArrowsAlt;

  _faDownload = faFileExport;

  POINT_TYPE = 1;
  AREA_TYPE = 2;

  HIGH_RESOLUTION = 20;
  LOW_RESOLUTION = 10;

  expanded: boolean = true;

  @Input() layerMap: { [id: number]: MapLayerModel };
  @Input() unitIndex: number;
  @Input() initializationData: AnalysisUnitState | null;
  @Output() deleteAnalysis: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('content') modalContent: ElementRef;

  loading = false;

  showDepthProfile: boolean = false;
  showMonotemporal: boolean = false;
  showTimeseries: boolean = false;
  showArea: boolean = false;

  histogramClasses: number = 10;

  layers: { 
    model: MapLayerModel,
    timeSeriesAvailable: boolean,
    depthProfileAvailable: boolean;
    monotemporal: boolean;
  }[] = [];

  pointCoordinates: number[] = [0, 0];

  colors = ["#3d87ff", "#107a10", "#db2323", "#7d059e", "#f0df2b"];

  layerSelector: number = 0;
  typeSelector: number = 0;
  analysisName: string = "";
  samplingSelector: number = 0;

  totalArea: number = 0;

  doneAnalysis: boolean = false;

  featureData: {value: any, units: any} = { value: null, units: null};

  singlePointMonotemporalAnalysis: {readable_name: string, data: {value: any, units: any}}[] = [];

  pointSource = new VectorSource({
    wrapX: false
  });

  pointVector = new VectorLayer({
    source: this.pointSource,
    zIndex: 999, //Always on top
  });

  pointDraw = new Draw({
    source: this.pointSource,
    type: "Point"
  });

  graphDepthProfile: Array<any> = [];
  graphTimeSeries: Array<any> = [];
  numberOfTimeSeriesPlots: number = 0;
  numberOfDepthProfilePlots: number = 0;
  areaResults: any[] = [];

  availableLayers: any = [];
  capturingPoint: boolean = false;

  constructor(
    private mapService: MapServiceService,
    private mediator: MediatorService,
    private modalService: NgbModal,
    private globals: GlobalsService,
    private utils: UtilsService
  ) { }

  toggleExpanded(){
    this.expanded = !this.expanded;
  }

  capturePoint(){
    this.capturingPoint = true;
    this.mapService.capturingAnalysisPoint = true;
    this.pointVector.getSource().clear();
    this.mapService.getMap()?.addInteraction(this.pointDraw);
  }

  ngOnInit(): void {
    this.buildAvailableLayers();
    this.mapService.getMap()?.addLayer(this.pointVector);
    this.mapService.getMap()?.on('singleclick', (evt) => {      
      if (this.capturingPoint) {
        this.capturingPoint = false;
        this.mapService.capturingAnalysisPoint = false;
        this.pointCoordinates = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        this.mapService.getMap()?.removeInteraction(this.pointDraw);
      }
    });

    this.mapService.getMap()?.on('pointermove', (evt) => {
      let map = this.mapService.getMap();
      if(map == null) return;
      map.getViewport().style.cursor = this.capturingPoint ? 'crosshair' : 'default';
    });

    if(this.initializationData){
      this.analysisName = this.initializationData.name;
      this.typeSelector = parseInt(this.initializationData.analysisType);
      this.expanded = this.initializationData.expanded;

      if(this.typeSelector == this.AREA_TYPE){
        this.samplingSelector = parseInt(this.initializationData.samplingResolution!);
        this.histogramClasses = parseInt(this.initializationData.histogramClasses!);
      } else if(this.typeSelector == this.POINT_TYPE){
        this.pointCoordinates = this.initializationData.coordinates!;
      }

      this.layers = this.initializationData.layerIds.map(id => {
        return {
          model: this.layerMap[id],
          timeSeriesAvailable: this.layerMap[id].data.parameters.includes("time"),
          depthProfileAvailable: this.layerMap[id].data.parameters.includes("elevation"),
          monotemporal: this.layerMap[id].data.frequency.includes("monotemporal")
        }
        
      })

    } 
  
  }

  ngOnDestroy(): void{
    
  }

  async performAnalysis(openModal: boolean){
    if(openModal){
      this.openAnalysisUnit();
    }
    this.doneAnalysis = true;
    if(this.typeSelector == this.AREA_TYPE){
      this.performAreaAnalysis();
    }
    else if(this.typeSelector == this.POINT_TYPE){
      this.performPointAnalysis();
    }
  }

  performPointAnalysis(){
    let analysisCoordinates = transform(this.pointCoordinates, 'EPSG:4326', 'EPSG:3857');
    let mapResolution = this.mapService.getMap()?.getView().getResolution();
    this.graphDepthProfile = [];
    this.graphTimeSeries = []; 
    this.singlePointMonotemporalAnalysis = [];

    this.numberOfTimeSeriesPlots = this.layers.filter(element => {
      return element.timeSeriesAvailable;
    }).length;
    this.numberOfDepthProfilePlots = this.layers.filter(element => {
      return element.depthProfileAvailable;
    }).length;

    for(let [i, layer] of this.layers.entries()){

      //Extract data
      this.showMonotemporal = true;
      let dataPromise = this.mediator.getData(layer.model, mapResolution, analysisCoordinates);
      dataPromise.then((data) => {
        let dataPoint = {
          readable_name: layer.model.data.readable_name,
          data: data
        }
        this.singlePointMonotemporalAnalysis.push(dataPoint);
      })

      if(layer.timeSeriesAvailable){
        this.showTimeseries = true;
        let timeSeriesX = layer.model.paramsObject["time"].values;
        let startDate = timeSeriesX[timeSeriesX.length - 1];
        let endDate = timeSeriesX[0];
        let elevation = layer.model.params.includes("elevation") ? layer.model.paramsObject['elevation'].selected : null;
        let dataPromise = this.mediator.getTimeSeries(layer.model, mapResolution, analysisCoordinates, startDate, endDate, elevation);

        dataPromise.then((data) => {
          let plot = {
            coordinates: this.pointCoordinates,
            data: [{
              x: data.x,
              y: data.y, 
              type: "scatter",
              mode: 'lines+points', 
              name: layer.model.data.readable_name + " (" + layer.model.data.units + ")",
              marker: {color: this.colors[i]},
            }],
            layout: { 
              showlegend: true,
              legend: {
                x: 1,
                xanchor: 'right',
                y: 1
              },
              xaxis: {
                title: 'Date',
              },
              yaxis: {
                title: 'Value',
              },
            },
            config: {}
          }
          this.graphTimeSeries.push(plot);                    
        });
      }
  
      if(layer.depthProfileAvailable){
        this.showDepthProfile = true;
        let time = layer.model.paramsObject["time"].selected;
        let dataPromise = this.mediator.getDepthProfile(layer.model, mapResolution, analysisCoordinates, time);
        
        dataPromise.then((data) => {
          let plot = {
            coordinates: this.pointCoordinates,
            data: [{
              x: data.x,
              y: data.y, 
              type: "scatter",
              mode: 'lines+points', 
              name: layer.model.data.readable_name + " (" + layer.model.data.units + ")",
              marker: {color: this.colors[i]}
            }],
            layout: {
              showlegend: true,
              legend: {
                x: 1,
                xanchor: 'right',
                y: 1
              },
              xaxis: {
                title: 'Value',
              },
              yaxis: {
                title: 'Depth (meters)',
              }
            },
            config: {},
            loading: false
          }
          this.graphDepthProfile.push(plot);
        });
      }
    }
  }

  performAreaAnalysis(){
    let bbox = this.globals.bbox;
    let writter = new GeoJSON();
    let polygonGeoJSON = writter.writeFeatures(this.globals.areaOfInterest!.getFeatures());
    let classes = this.histogramClasses;

    // In km^2 -> m^2 divided by 10^6
    this.totalArea = this.globals.areaOfInterest!.getFeatures()[0].getGeometry().getArea() / 1000000;
    console.log(polygonGeoJSON);
    this.showArea = true;
    this.areaResults = [];
    
    for(let [i, layer] of this.layers.entries()){
      let params: any = {};
      if(layer.model.params.includes("time")){
        params["time"] = layer.model.paramsObject["time"].selected;
      }

      if(layer.model.params.includes("elevation")){
        params["elevation"] = layer.model.paramsObject["elevation"].selected
      }

      let resolution = this.samplingSelector == this.HIGH_RESOLUTION ? "high" : "low";
      let dataPromise = this.mediator.getAreaData(layer.model, bbox, polygonGeoJSON.toString(), classes, resolution, params=params);
      dataPromise.then((data) => {
        let dataMatrix = {
          readable_name: layer.model.data.readable_name,
          units: layer.model.data.units,
          data: data,
          histogram: {
            data: [{
              x: data.histogram[1],
              y: data.histogram[0],
              type: "bar",
              name: layer.model.data.readable_name + " (" + layer.model.data.units + ")",
            }],
            layout: { 
              showlegend: true,
              legend: {
                x: 1,
                xanchor: 'right',
                y: 1
              },
            },
          } 
        }

        this.areaResults.push(dataMatrix);    
      });
    }
    this.doneAnalysis = true;
    
  }

  addLayer(){
    let index = this.layerSelector;

    this.layers.push({
      model: this.layerMap[index],
      timeSeriesAvailable: this.layerMap[index].data.parameters.includes("time"),
      depthProfileAvailable: this.layerMap[index].data.parameters.includes("elevation"),
      monotemporal: this.layerMap[index].data.frequency.includes("monotemporal")
    });
    this.buildAvailableLayers();
    this.layerSelector = 0;
  }

  removeLayer(index: number){
    this.layers.splice(index, 1);
    this.buildAvailableLayers();
  }

  buildAvailableLayers(){
    let layerMap = this.mapService.getLayerMap();
    this.availableLayers = Object.values(layerMap).filter((element) => {
      let added = this.layers.find((addedLayer) => {
        return element.data.id == addedLayer.model.data.id;
      });
      return element.visible && added == undefined;
    })
    console.log(this.availableLayers);
  }

  remove(){
    this.deleteAnalysis.emit(this.unitIndex);
  }

  openAnalysisUnit() {
    this.modalService.open(this.modalContent, { size: 'xl', scrollable: true });
  }

  donwloadTimeSeriesData(plotData: any){
    let xData = plotData.data[0].x;
    let yData = plotData.data[0].y;
    let csvObject = [];
    for(let i = 0; i < xData.length; i++){
      let row = [];
      row.push(xData[i]);
      row.push(yData[i]);
      csvObject.push(row);
    }
    let prevData = ["Coordinates of analysis: " + plotData.coordinates.join(",")];
    let headers = ["Time", plotData.data[0].name];
    let csvString = this.utils.csvStringFromData(headers, csvObject, prevData);
    
    if(csvString != null){
      const blob = new Blob([csvString!], { type: 'text/csv' });
      const url= window.URL.createObjectURL(blob);
      window.open(url);
    }    
  }

  donwloadDepthProfileData(plotData: any){
    let xData = plotData.data[0].x;
    let yData = plotData.data[0].y;
    let csvObject = [];
    for(let i = 0; i < xData.length; i++){
      let row = [];
      row.push(yData[i]);
      row.push(xData[i]);
      csvObject.push(row);
    }
    let prevData = ["Coordinates of analysis: " + plotData.coordinates.join(",")];
    let headers = ["Elevation (meters)", plotData.data[0].name];
    let csvString = this.utils.csvStringFromData(headers, csvObject, prevData);
    
    if(csvString != null){
      const blob = new Blob([csvString!], { type: 'text/csv' });
      const url= window.URL.createObjectURL(blob);
      window.open(url);
    }    
  }

}
