import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faChevronDown, faGreaterThan } from '@fortawesome/free-solid-svg-icons';
import { LayerModel } from 'src/app/core/models/layerModel';

type nodeModel = { id: string, name: string, layers: LayerModel[] };

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {

  _faGreaterThan = faGreaterThan;
  _faChevronDown = faChevronDown

  @Input() node: nodeModel;
  @Output() layerManipulation: EventEmitter<any> = new EventEmitter<any>();
  /**
  "id": 22,
  "name": "Sea Water Potential Temperature (monthly-m)",
  "layers": []
  */
  layers: any[] = [];

  expanded = false;

  childrenLayers: any[] = [];

  numberOfChildren: number = 0;

  constructor() { }

  toggleExpanded(){
    this.expanded = !this.expanded;
  }

  ngOnInit(): void {
    this.layers = this.node.layers;
    this.numberOfChildren = this.totalChildren(this.node);
    
    this.layers.forEach(element => {
      this.childrenLayers.push({
        selected: false,
        data: element
      });
    });
  }

  totalChildren(root: nodeModel){
    let children_layers = root.layers.length;    
    return children_layers;
  }

  emitChangeSelected(layer: any){
    layer.selected = !layer.selected;
    let data = {
      id: layer.data.id,
      event: "selected",
      value: layer.selected
    }
    this.layerManipulation.emit(data);
  }

  layerManipulationBackPropagation(data: any){
    this.layerManipulation.emit(data)    
  }

}
