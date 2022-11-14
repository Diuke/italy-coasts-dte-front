import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LayerModel } from '../models/layerModel';
import { MapLayerModel } from '../models/mapLayerModel';
import { GlobalsService } from './globals.service';
import { UrlsService } from './urls.service';

@Injectable({
  providedIn: 'root'
})
export class MediatorService {

  public static GET_DATA_POINT_TYPE = "point";
  public static GET_DATA_AREA_TYPE = "area";
  public static GET_DATA_DEPTH_PROFILE_TYPE = "depth_profile";
  public static GET_DATA_TIME_SERIES_TYPE = "time_series";

  private url_templates = {
    "dimension_values": "/api/dte/mediator/list-parameter-values", // /layer_id/param_name
    "getData": "/api/dte/mediator/get-data",
    "getTimeSeries": "/api/dte/mediator/get-data",
    "getDepthProfile": "/api/dte/mediator/get-data",
    "getAreaData": "/api/dte/mediator/get-data"
  }

  constructor(
    private http: HttpClient,
    public globalService: GlobalsService,
    private urlService: UrlsService
  ) { }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // PUBLIC GET METHODS //////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  public getTimestamps(){
  }

  public getDimensionValues(layer: LayerModel, dimension: string){
    return this.requestDimensionData(layer, dimension);
  }

  public getData(layer: MapLayerModel, coordinates: any, params?: any) {
    let layerData = this.requestData(layer, coordinates, params);
    return layerData;
  }

  public getTimeSeries(layer: MapLayerModel, coordinates: any, startDate: string, endDate: string, elevation: string | null) {
    let params = {
      start_date: startDate,
      end_date: endDate,
    }
    if(elevation != null){
      params["elevation"] = elevation;
    }
    let layerData = this.requestTimeSeries(layer, coordinates, params);
    return layerData;
  }

  public getDepthProfile(layer: MapLayerModel, coordinates: any, params: any) {    
    let layerData = this.requestDepthProfile(layer, coordinates, params);
    return layerData;
  }

  public getAreaData(layer: MapLayerModel, params: any) {
    let layerData = this.requestAreaData(layer, params);
    return layerData;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // PRIVATE REQUESTS ////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  // The available parameters are in the GetCapabilities request
  private async requestDimensionData(layer: LayerModel, dimension: string){
    let url = this.urlService.BASE_PATH + this.url_templates["dimension_values"] + "/" + layer.id + "/" + dimension;

    let resp: any = null;
    if (url) {
      let request = this.http.get(url).toPromise();
      await request.then(data => {
        resp = data;
      }).catch(error => {
        resp = null;
      });
    }
    return resp;
  }

  private async requestData(layer_model: MapLayerModel, coordinates: number[], params?: any): Promise<{value: any, units: string}> {
    let url = this.urlService.BASE_PATH + this.url_templates["getData"];
    let latMin = coordinates[0];
    let lngMin = coordinates[1];
    let latMax = latMin + 0.1; //0.1 meters bbox
    let lngMax = lngMin + 0.1; //0.1 meters bbox
    let bbox = latMin.toString() + "," + lngMin.toString() + "," + latMax.toString() + "," + lngMax.toString(); 

    if(params){
      params["bbox"] = bbox;
    } else {
      params = {
        bbox: bbox
      };
    }

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      type: MediatorService.GET_DATA_POINT_TYPE,
      params: params
    };
    
    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      }).catch(error => {
        resp = null;
      });
    }
    return resp;
  }

  /**
   * 
   * @param layer_model 
   * @param coordinates 
   * @param params should have bbox, start_date, end_date. Other dimensions are optional.
   * @returns 
   */
  private async requestTimeSeries(layer_model: MapLayerModel, coordinates: number[], params: any){
    let url = this.urlService.BASE_PATH + this.url_templates["getTimeSeries"];
    let latMin = coordinates[0];
    let lngMin = coordinates[1];
    let latMax = latMin + 0.1; //0.1 meters bbox
    let lngMax = lngMin + 0.1; //0.1 meters bbox
    let bbox = latMin.toString() + "," + lngMin.toString() + "," + latMax.toString() + "," + lngMax.toString(); 
    params["bbox"] = bbox;

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      type: MediatorService.GET_DATA_TIME_SERIES_TYPE,
      params: params
    };

    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      }).catch(error => {
        resp = null;
      });
    }
    return resp;
  }

  /**
   * 
   * @param layer_model 
   * @param coordinates 
   * @param params should be bbox and optionally time or other dimensions.
   * @returns 
   */
  private async requestDepthProfile(layer_model: MapLayerModel, coordinates: number[], params: any){
    console.log(params);
    
    let url = this.urlService.BASE_PATH + this.url_templates["getDepthProfile"];
    let latMin = coordinates[0];
    let lngMin = coordinates[1];
    let latMax = latMin + 0.1; //0.1 meters bbox
    let lngMax = lngMin + 0.1; //0.1 meters bbox
    let bbox = latMin.toString() + "," + lngMin.toString() + "," + latMax.toString() + "," + lngMax.toString(); 
    params["bbox"] = bbox;

    let resp: any = null;
    let body = {
      layer_id: layer_model.data.id,
      type: MediatorService.GET_DATA_DEPTH_PROFILE_TYPE,
      params: params
    };

    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      }).catch(error => {
        resp = null;
      });
    }
    return resp;
  }

  /**
   * 
   * @param layer_model 
   * @param params bbox, resolution, polygon, classes, optional dimensions.
   * @returns 
   */
  private async requestAreaData(layer_model: MapLayerModel, params: any){
    let url = this.urlService.BASE_PATH + this.url_templates["getAreaData"];
    let body = {
      layer_id: layer_model.data.id,
      type: MediatorService.GET_DATA_AREA_TYPE,
      params: params
      // bbox: bbox.join(","),
      // time: time,
      // elevation: elevation,
      // resolution: resolution,
      // polygon: polygonGeoJSON,
      // classes: numberOfClasses
    };

    let resp: any = null;
    if (url) {
      let request = this.http.post(url, body).toPromise();
      await request.then(data => {
        resp = data;
      }).catch(error => {
        resp = null;
      });
    }
    return resp;
  }

}
