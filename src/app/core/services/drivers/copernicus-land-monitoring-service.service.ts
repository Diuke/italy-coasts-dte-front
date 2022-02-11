import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MapLayerModel } from '../../models/mapLayerModel';
import { GlobalsService } from '../globals.service';
import { UrlsService } from '../urls.service';

@Injectable({
  providedIn: 'root'
})
export class CopernicusLandMonitoringServiceService {

  constructor(
    private http: HttpClient,
    public globalService: GlobalsService,
    private urlService: UrlsService
  ) { }

  private url_templates = {
    //"dimension_values": "/api/dte/copernicus_marine_services/list_parameter_values", // /layer_id/param_name
    "getData": "/api/dte/copernicus_land_services/getData" 
  }

  async requestData(layer_model: MapLayerModel, mapResolution: any, coordinates: any){
    let x = coordinates[0];
    let y = coordinates[1];
    let queryUrl = "";
    if(layer_model.data.type == "ARCGIS_MS"){
      queryUrl = layer_model.data.service_url + "/identify?";
      queryUrl += 'geometry={"x": ' + x + ',"y":' + y + '}';
      queryUrl += "&tolerance=1";
      queryUrl += "&mapExtent=" + (x-1) + "," + (y-1) + "," + (x+1) + "," + (y+1);
      queryUrl += "&imageDisplay=" + 600 + "," + 550 + ",96";
      queryUrl += "&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=pjson"

    } else if(layer_model.data.type == "ARCGIS_IS"){
      queryUrl = layer_model.data.service_url + "/identify?";
      queryUrl += 'geometry={"x": ' + x + ',"y":' + y + '}';
      queryUrl += "&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&returnPixelValues=true&processAsMultidimensional=false&maxItemCount=1&f=pjson"
    } else {
      let getFeatureInfoUrl = layer_model.layer.getSource().getFeatureInfoUrl(
        coordinates,
        mapResolution,
        'EPSG:3857',
        { 'INFO_FORMAT': 'text/xml' }
      );
      queryUrl = getFeatureInfoUrl;

    }

    let url = this.urlService.BASE_PATH + this.url_templates["getData"];

    let resp = null;
    let body = {
      layer_id: layer_model.data.id,
      request_url: queryUrl
    };
    if (url) {
      let response = await this.http.post(url, body).subscribe(data => {
        resp = data;
      });
    }
    console.log(resp);
    return resp;
  }
}
