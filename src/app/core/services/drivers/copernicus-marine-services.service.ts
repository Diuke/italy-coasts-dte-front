import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LayerModel } from '../../models/layerModel';
import { GlobalsService } from '../globals.service';
import { UrlsService } from '../urls.service';
import { MapLayerModel } from '../../models/mapLayerModel';

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
    "dimension_values": "/api/dte/copernicus_marine_services/list_parameter_values", // /layer_id/param_name
    "getData": "/api/dte/copernicus_marine_services/getData" 
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

  async requestData(layer_model: MapLayerModel, mapResolution: any, coordinates: any){
    let getFeatureInfoUrl = layer_model.layer.getSource().getFeatureInfoUrl(
      coordinates,
      mapResolution,
      'EPSG:3857',
      { 'INFO_FORMAT': 'text/xml' }
    );

    let url = this.urlService.BASE_PATH + this.url_templates["getData"];

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      request_url: getFeatureInfoUrl
    };
    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      });
    }
    console.log(resp);
    return resp;
  }
    
}
