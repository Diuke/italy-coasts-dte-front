import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  constructor() {
  }

  private layerSelected: { [layerId: number]: boolean } = {};

  getLayerSelected: Subject<{ [layerId: number]: boolean }> = new Subject<{ [layerId: number]: boolean }>();
  
  setLayerSelected(newLayerSelected: { [layerId: number]: boolean }){
    this.layerSelected = newLayerSelected;
    this.getLayerSelected.next(this.layerSelected);
  }

  changeLayerSelected(layerId: number, selected: boolean){
    this.layerSelected[layerId] = selected;
    this.getLayerSelected.next(this.layerSelected);
  }

}
