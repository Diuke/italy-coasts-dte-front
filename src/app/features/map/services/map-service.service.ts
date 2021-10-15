import { Injectable } from '@angular/core';
import { UrlsService } from 'src/app/core/services/urls.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapServiceService {
  BASE_URL = environment.base_path;

  constructor(
    private urlsService: UrlsService
  ) { }

  getLayersWMS(){
    let URL = this.urlsService.buildUrl("layers_wms");
    return fetch(URL);
  }

  getLayersWFS(){
    let URL = this.urlsService.buildUrl("layers_wfs");
    return fetch(URL);
  }

  getLayerHierarchy(start_date: string, end_date: string){
    let URL = this.urlsService.buildUrl("layer_hierarchy") + "?" + start_date + ";" + end_date;
    return fetch(URL);
  }
}