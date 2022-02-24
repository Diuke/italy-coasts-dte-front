import { Injectable } from '@angular/core';
import { UrlsService } from 'src/app/core/services/urls.service';
import { environment } from 'src/environments/environment';
import Map from 'ol/Map';
import { MapLayerModel } from 'src/app/core/models/mapLayerModel';

@Injectable({
  providedIn: 'root'
})
export class MapServiceService {
  BASE_URL = environment.base_path;

  public globalMap: Map | null= null;
  public layerMap: { [id: number]: MapLayerModel } = {};

  constructor(
    private urlsService: UrlsService
  ) { }

  setMap(map: Map){
    this.globalMap = map;
  }

  getMap(){
    return this.globalMap;
  }

  getLayerMap(){
    return this.layerMap;
  }

  getLayersWMS(){
    let URL = this.urlsService.buildUrl("layers_wms");
    return fetch(URL);
  }

  getLayersWFS(){
    let URL = this.urlsService.buildUrl("layers_wfs");
    return fetch(URL);
  }

  getLayerHierarchy(start_date: string, end_date: string){
    let URL = this.urlsService.buildUrl("layer_hierarchy");
    if(start_date && end_date){
      URL += "?start_date=" + start_date + "&end_date=" + end_date;
    }
    return fetch(URL);
  }
}
