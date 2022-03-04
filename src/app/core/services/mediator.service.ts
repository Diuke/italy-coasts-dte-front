import { Injectable } from '@angular/core';
import { LayerModel } from '../models/layerModel';
import { MapLayerModel } from '../models/mapLayerModel';
import { CopernicusLandMonitoringServiceService } from './drivers/copernicus-land-monitoring-service.service';
import { CopernicusMarineServicesService } from './drivers/copernicus-marine-services.service';
import { WorldpopService } from './drivers/worldpop.service';

@Injectable({
  providedIn: 'root'
})
export class MediatorService {

  constructor(
    private copernicusMarineServicesDriver: CopernicusMarineServicesService,
    private copernicusLandServicesDriver: CopernicusLandMonitoringServiceService,
    private worldpopDriver: WorldpopService
  ) { }

  getMetadata(layer: LayerModel, item: string){
    if(layer.source == "Copernicus Marine Services"){
      return this.copernicusMarineServicesDriver.requestMetadata(layer, item);
    }

    return null;
  }

  getTimestamps(){
  }

  getDimensionValues(layer: LayerModel, dimension: string){
    if(layer.source == "Copernicus Marine Services"){
      return this.copernicusMarineServicesDriver.requestDimensionData(layer, dimension);
    }

    return null;
  }

  async getData(layer: MapLayerModel, mapResolution: any, coordinates: any, params?: any) {
    if(layer.data.source == "Copernicus Marine Services"){
      let layerData = this.copernicusMarineServicesDriver.requestData(layer, mapResolution, coordinates, params);
      return layerData;
    }

    else if(layer.data.source == "Copernicus Land Monitoring Service"){
      let layerData = this.copernicusLandServicesDriver.requestData(layer, mapResolution, coordinates);
      return layerData;
    }

    else if(layer.data.source == "WorldPop"){
      let layerData = this.worldpopDriver.requestData(layer, mapResolution, coordinates);
      return layerData;
    }

    else {
      return {value: null, units: null};
    }
  }

}
