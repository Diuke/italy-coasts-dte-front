import { Injectable } from '@angular/core';
import { LayerModel } from '../models/layerModel';
import { CopernicusMarineServicesService } from './drivers/copernicus-marine-services.service';

@Injectable({
  providedIn: 'root'
})
export class MediatorService {

  constructor(
    private copernicusMarineServicesDriver: CopernicusMarineServicesService
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

}
