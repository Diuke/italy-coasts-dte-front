import { Layer } from "ol/layer";
import { LayerModel } from "./layerModel";

export class MapLayerModel {
    data: LayerModel;
    layer: Layer < any >;
    expanded: boolean;
    visible: boolean; 
    opacity: number; 
    params: [];
    paramsObject: { [key: string]: { values: string[], default: string, selected: string } }
}