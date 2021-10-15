import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UrlsService {

  constructor() { }

  public BASE_PATH = environment.base_path;

  private urls_patterns: { [key: string]: string } = {
    "login": "/api/auth/token/",
    "refresh": "/api/auth/token/refresh",
    "layers_wms": "/api/dte/layers/wms",
    "layers_wfs": "/api/dte/layers/wfs",
    "all_layers": "/api/dte/layers/all",
    "layer_hierarchy": "/api/dte/categories_hierarchy",
  }

  buildUrl(identifyer: string){
    return this.BASE_PATH + this.urls_patterns[identifyer];
  }
}
