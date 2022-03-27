import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LayerModel } from '../../models/layerModel';
import { GlobalsService } from '../globals.service';
import { UrlsService } from '../urls.service';
import { MapLayerModel } from '../../models/mapLayerModel';
import Polygon from 'ol/geom/Polygon';

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
    "getData": "/api/dte/copernicus_marine_services/getData",
    "getTimeSeries": "/api/dte/copernicus_marine_services/getTimeSeries",
    "getDepthProfile": "/api/dte/copernicus_marine_services/getDepthProfile",
    "getAreaData": "/api/dte/copernicus_marine_services/getAreaData",
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

  async requestAreaData(layer_model: MapLayerModel, bbox: number[], polygonGeoJSON: string, numberOfClasses: number, resolution: string, params?: any){
    let url = this.urlService.BASE_PATH + this.url_templates["getAreaData"];
    let time = params["time"];
    let elevation = null;
    if(params["elevation"]){
      elevation = params["elevation"];
    }
    let body = {
      layer_id: layer_model.data.id,
      bbox: bbox.join(","),
      time: time,
      elevation: elevation,
      resolution: resolution,
      polygon: polygonGeoJSON,
      classes: numberOfClasses
    };

    let resp: any = null;
    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      });
    }
    console.log(resp);
    return resp;
  }

  async requestTimeSeries(layer_model: MapLayerModel, mapResolution: any, coordinates: any, startDate: string, endDate: string, elevation: string | null){
    let requestParams = {
      'INFO_FORMAT': 'text/xml'
    }

    let getFeatureInfoUrl: string = layer_model.layer.getSource().getFeatureInfoUrl(
      coordinates,
      mapResolution,
      'EPSG:3857',
      requestParams
    );

    //Creating a base layer with the power of OpenLayers
    let url = this.urlService.BASE_PATH + this.url_templates["getTimeSeries"];

    //Removing time and elevation parameters
    let urlSplit = getFeatureInfoUrl.split("?");
    let paramsSplit = urlSplit[1].split("&");
    let indexTime = paramsSplit.findIndex((element) => {
      return element.includes("time=");
    })
    paramsSplit.splice(indexTime, 1);
    let indexElevation = paramsSplit.findIndex((element) => {
      return element.includes("elevation=");
    })
    paramsSplit.splice(indexElevation, 1);

    //Join everything again
    urlSplit[1] = paramsSplit.join("&");
    let baseServiceUrl = urlSplit.join("?");

    console.log(baseServiceUrl);

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      base_url: baseServiceUrl,
      start_date: startDate,
      end_date: endDate,
      elevation: elevation ? elevation : null
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

  async requestDepthProfile(layer_model: MapLayerModel, mapResolution: any, coordinates: any, time: string){
    let requestParams = {
      'INFO_FORMAT': 'text/xml'
    }

    //Creating a base layer with the power of OpenLayers
    let getFeatureInfoUrl: string = layer_model.layer.getSource().getFeatureInfoUrl(
      coordinates,
      mapResolution,
      'EPSG:3857',
      requestParams
    );

    let url = this.urlService.BASE_PATH + this.url_templates["getDepthProfile"];

    //Removing time and elevation parameters
    let urlSplit = getFeatureInfoUrl.split("?");
    let paramsSplit = urlSplit[1].split("&");
    let indexTime = paramsSplit.findIndex((element) => {
      return element.includes("time=");
    })
    paramsSplit.splice(indexTime, 1);
    let indexElevation = paramsSplit.findIndex((element) => {
      return element.includes("elevation=");
    })
    paramsSplit.splice(indexElevation, 1);

    //Join everything again
    urlSplit[1] = paramsSplit.join("&");
    let baseServiceUrl = urlSplit.join("?");

    console.log(baseServiceUrl);

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      base_url: baseServiceUrl,
      time: time
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

  async requestData(layer_model: MapLayerModel, mapResolution: any, coordinates: any, params?: any){
    let requestParams = {
      'INFO_FORMAT': 'text/xml'
    }
    if(params){
      requestParams = { ...requestParams, ...params };
    }

    let getFeatureInfoUrl = layer_model.layer.getSource().getFeatureInfoUrl(
      coordinates,
      mapResolution,
      'EPSG:3857',
      requestParams
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
