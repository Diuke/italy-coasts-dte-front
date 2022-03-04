import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MapLayerModel } from 'src/app/core/models/mapLayerModel';
import { MediatorService } from 'src/app/core/services/mediator.service';
import { MapServiceService } from '../../services/map-service.service';
import { transform } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { faChevronDown, faChevronUp, faExpand, faExpandArrowsAlt, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

  POINT_TYPE = 1;
  AREA_TYPE = 2;

  expanded: boolean = true;

  @Input() layerMap: { [id: number]: MapLayerModel };

  loading = false;

  showDepthProfile: boolean = false;
  showMonotemporal: boolean = false;
  showTimeseries: boolean = false;

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

  graphDepthProfile: any = {
    data: [],
    layout: {
      title: 'Depth Profile',
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
      },
    },
    config: {responsive: true}
  }

  graphTimeSeries: any = {
    data: [],
    layout: { 
      title: 'Time Series',
      showlegend: true,
      legend: {
        x: 1,
        xanchor: 'right',
        y: 1
      },
      xaxis: {
        title: 'Date',
        //titlefont: { family: 'Arial, sans-serif', size: 18, color: 'lightgrey' },
        //showticklabels: true,
        //tickangle: 'auto',
      },

      yaxis: {
        title: 'Value',
        //titlefont: { family: 'Arial, sans-serif', size: 18, color: 'lightgrey' },
        //showticklabels: true,
        //tickangle: 'auto',
      },
    },
    config: {responsive: true}
  };

  availableLayers: any = [];
  capturingPoint: boolean = false;

  constructor(
    private mapService: MapServiceService,
    private mediator: MediatorService,
    private modalService: NgbModal
  ) { }

  toggleExpanded(){
    this.expanded = !this.expanded;
  }

  capturePoint(){
    this.capturingPoint = true;
    this.pointVector.getSource().clear();
    this.mapService.getMap()?.addInteraction(this.pointDraw);
  }

  ngOnInit(): void {
    this.buildAvailableLayers();
    this.mapService.getMap()?.addLayer(this.pointVector);
    this.mapService.getMap()?.on('singleclick', (evt) => {      
      if (this.capturingPoint) {
        this.capturingPoint = false;
        this.pointCoordinates = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        this.mapService.getMap()?.removeInteraction(this.pointDraw);
      }
    });

    this.mapService.getMap()?.on('pointermove', (evt) => {
      let map = this.mapService.getMap();
      if(map == null) return;
      map.getViewport().style.cursor = this.capturingPoint ? 'crosshair' : 'default';
    });
  
  }

  ngOnDestroy(): void{
    
  }

  async performAnalysis(){
    await this.performPointAnalysis();
    this.doneAnalysis = true;
  }

  async performPointAnalysis(){
    let analysisCoordinates = transform(this.pointCoordinates, 'EPSG:4326', 'EPSG:3857');
    let mapResolution = this.mapService.getMap()?.getView().getResolution();
    //this.featureData = await this.mediator.getData(this.layer, mapResolution, analysisCoordinates);

    for(let [i, layer] of this.layers.entries()){
      if(layer.monotemporal) {
        this.showMonotemporal = true;
        let dataPromise = this.mediator.getData(layer.model, mapResolution, analysisCoordinates);
        dataPromise.then((data) => {
          let dataPoint = {
            readable_name: layer.model.data.readable_name,
            data: data
          }
          this.singlePointMonotemporalAnalysis.push(dataPoint);
        })

      } else {
        if(layer.timeSeriesAvailable){
          this.showTimeseries = true;
          let dataPromises = []
          let timeSeriesX = layer.model.paramsObject["time"].values;
          for(let i = 0; i < timeSeriesX.length; i++){
            let params = {
              "time": timeSeriesX[i]
            }
            dataPromises[i] = this.mediator.getData(layer.model, mapResolution, analysisCoordinates, params);
          }
  
          Promise.all(dataPromises).then((values) => {
            let x = [];
            let y = [];
            for(let i = 0; i < timeSeriesX.length; i++){
              if(values[i].value != 'none'){
                y.push(values[i].value);
                x.push(timeSeriesX[i]);
              }
            }
  
            let plot = {
              x: x,
              y: y, 
              type: "scatter",
              mode: 'lines+points', 
              name: layer.model.data.layer_name + " (" + layer.model.data.units + ")",
              marker: {color: this.colors[i]}
            }
            
            this.graphTimeSeries.data.push(plot);
          });
        }
  
        if(layer.depthProfileAvailable){
          this.showDepthProfile = true;
          let dataPromises = [];
          let depthProfileY = layer.model.paramsObject["elevation"].values;
          for(let i = 0; i < depthProfileY.length; i++){
            let params = {
              "elevation": depthProfileY[i]
            }
            dataPromises[i] = this.mediator.getData(layer.model, mapResolution, analysisCoordinates, params);
          }
  
          Promise.all(dataPromises).then((values) => {
            let x = [];
            let y = [];
            for(let i = 0; i < depthProfileY.length; i++){
              if(values[i].value != 'none'){
                x.push(values[i].value);
                y.push(parseFloat(depthProfileY[i]));
              }
            }
  
            let plot = {
              x: x,
              y: y, 
              type: "scatter",
              mode: 'lines+points', 
              name: layer.model.data.layer_name + " (" + layer.model.data.units + ")",
              marker: {color: this.colors[i]}
            }
            console.log(plot);
            
            this.graphDepthProfile.data.push(plot);
          });
        }
      }
    }
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

  deleteAnalysis(){

  }

  expandAnalysisUnit(content: any) {
    this.modalService.open(content, { size: 'xl', scrollable: true });
  }

}
