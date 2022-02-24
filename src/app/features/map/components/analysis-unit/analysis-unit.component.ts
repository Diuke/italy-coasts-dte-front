import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MapLayerModel } from 'src/app/core/models/mapLayerModel';
import { MediatorService } from 'src/app/core/services/mediator.service';
import { MapServiceService } from '../../services/map-service.service';
import { transform } from 'ol/proj';

@Component({
  selector: 'app-analysis-unit',
  templateUrl: './analysis-unit.component.html',
  styleUrls: ['./analysis-unit.component.scss']
})
export class AnalysisUnitComponent implements OnInit, OnDestroy {
  POINT_TYPE = 1;
  AREA_TYPE = 2;

  @Input() layerMap: { [id: number]: MapLayerModel };

  loading = false;

  layer: MapLayerModel;

  pointCoordinates: number[] = [0, 0];

  layerSelector: number = 0;
  typeSelector: number = 0;

  timeSeriesAvailable: boolean;
  depthProfileAvailable: boolean;
  monotemporal: boolean;

  doneAnalysis: boolean = false;

  singlePointMonotemporalAnalysis = {

  }

  graph = {
    data: [
        { x: [1, 2, 3], y: [2, 6, 3], type: 'scatter', mode: 'lines+points', marker: {color: 'red'} },
        { x: [1, 2, 3], y: [2, 5, 3], type: 'bar' },
    ],
    layout: {width: 320, height: 240, title: 'Plot Example'},
    config: {responsive: true}
};

  constructor(
    private mapService: MapServiceService,
    private mediator: MediatorService
  ) { }

  availableLayers: any = [];
  capturingPoint: boolean = false;

  capturePoint(){
    this.capturingPoint = true;
  }

  ngOnInit(): void {
    this.buildAvailableLayers();
    console.log(this.mapService.getMap());
    this.mapService.getMap()?.on('singleclick', (evt) => {      
      if (this.capturingPoint) {
        this.capturingPoint = false;
        this.pointCoordinates = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        //this.performPointAnalysis(evt.coordinate);
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

  featureData: {value: any, units: any} = { value: null, units: null};

  async performPointAnalysis(){
    let analysisCoordinates = transform(this.pointCoordinates, 'EPSG:4326', 'EPSG:3857');
    let mapResolution = this.mapService.getMap()?.getView().getResolution();
    this.featureData = await this.mediator.getData(this.layer, mapResolution, analysisCoordinates);
    
    if(this.monotemporal) {

    } else {
      if(this.timeSeriesAvailable){

      }

      if(this.depthProfileAvailable){

      }
    }

  }

  selectLayer(){
    let index = this.layerSelector;
    this.layer = this.layerMap[index];
    this.timeSeriesAvailable = this.layer.data.parameters.includes("time");
    this.depthProfileAvailable = this.layer.data.parameters.includes("elevation");
    this.monotemporal = this.layer.data.frequency.includes("monotemporal");
  }

  buildAvailableLayers(){
    let layerMap = this.mapService.getLayerMap();
    this.availableLayers = Object.values(layerMap).filter((element) => {
      return element.visible;
    })
    
  }

}
