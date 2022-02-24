import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MapLayerModel } from '../../models/mapLayerModel';
import { GlobalsService } from '../globals.service';
import { UrlsService } from '../urls.service';

@Injectable({
  providedIn: 'root'
})
export class WorldpopService {

  constructor(
    private http: HttpClient,
    public globalService: GlobalsService,
    private urlService: UrlsService
  ) { }

  private url_templates = {
    "getData": "/api/dte/worldpop/getData" 
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
