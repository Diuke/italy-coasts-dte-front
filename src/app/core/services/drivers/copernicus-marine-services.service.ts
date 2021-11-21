import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LayerModel } from '../../models/layerModel';
import * as xml2js from 'xml2js';
import { GlobalsService } from '../globals.service';
import { UrlsService } from '../urls.service';

@Injectable({
  providedIn: 'root'
})
export class CopernicusMarineServicesService {

  constructor(
    private http: HttpClient,
    public globalService: GlobalsService,
    private urlService: UrlsService
  ) { }

  private url_templates = {
    "dimension_values": "/api/dte/copernicus_marine_services/list_parameter_values" // /layer_id/param_name
  }

  async requestMetadata(layer: LayerModel, item: string) {
    let layerName = layer.layer_name;
    let baseUrl = layer.metadata_url;


    let bbox = this.globalService.bbox;
    let urlSuffix = "?request=GetMetadata&layers=" + layerName + "&item=" + item + "&box=" + bbox + "&height=100&width=100";
    if(layer.parameters.includes("time")){
      urlSuffix += "&time=" + this.globalService.globalDateTime;
    }
    if(layer.parameters.includes("elevation")){
      urlSuffix += "&elevation=" + this.globalService.globalElevation;
    }
    let url = baseUrl + urlSuffix;

    let metadata = null;
    await this.http.get(url).subscribe(data => {
      metadata = data;
    })
    return metadata;

  }

  requestlegend(layer: LayerModel) {

  }

  // The available parameters are in the GetCapabilities request
  requestDimensionData(layer: LayerModel, dimension: string){
    let url = this.urlService.BASE_PATH + this.url_templates["dimension_values"] + "/" + layer.id + "/" + dimension;
    return this.http.get(url);
  }
    
}
