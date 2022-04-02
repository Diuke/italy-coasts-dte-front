import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faChevronDown, faGreaterThan } from '@fortawesome/free-solid-svg-icons';
import { LayerCategory, LayerModel } from 'src/app/core/models/layerModel';
import { LayerService } from 'src/app/core/services/layer.service';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {

  _faGreaterThan = faGreaterThan;
  _faChevronDown = faChevronDown;

  layerSelected: { [layerId: number]: boolean } = {};

  @Input() node: LayerCategory;
  @Output() layerManipulation: EventEmitter<any> = new EventEmitter<any>();
  /**
  "id": 22,
  "name": "Sea Water Potential Temperature (monthly-m)",
  "layers": []
  */
  layers: LayerModel[] = [];

  expanded = false;

  numberOfChildren: number = 0;

  constructor(
    public layerService: LayerService
  ) {
    this.layerService.getLayerSelected.subscribe(layers => {
      this.layerSelected = layers;
    })
  }

  toggleExpanded(){
    this.expanded = !this.expanded;
  }

  ngOnInit(): void {
    this.layers = this.node.layers;
    this.numberOfChildren = this.totalChildren(this.node);
  }

  totalChildren(root: LayerCategory){
    let children_layers = root.layers.length;    
    return children_layers;
  }

  emitChangeSelected(layer: LayerModel){
    let data = {
      id: layer.id,
      event: "selected",
      value: this.layerSelected[layer.id]
    }
    this.layerManipulation.emit(data);
  }

  layerManipulationBackPropagation(data: any){
    this.layerManipulation.emit(data)    
  }

}
