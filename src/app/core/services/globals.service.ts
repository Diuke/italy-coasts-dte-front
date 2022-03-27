import { Injectable } from '@angular/core';
import Polygon from 'ol/geom/Polygon';
import { Layer } from 'ol/layer';
import Source from 'ol/source/Source';
import VectorSource from 'ol/source/Vector';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {

  public contextStartDate: Date|null;
  public contextEndDate: Date|null;

  public globalDateTime: Date;
  public globalElevation: number;

  public bbox: number[];
  public areaOfInterest: VectorSource<Polygon> | null;

  constructor() {
    this.contextStartDate = null;
    this.contextEndDate = null;
  }
}
