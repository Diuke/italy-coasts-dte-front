import { Coordinate } from "ol/coordinate"
import GeoJSON from "ol/format/GeoJSON"
import Polygon from "ol/geom/Polygon"

export class ApplicationState {
    context: ContextState
    layers: LayerState[]
    analysisUnits: AnalysisUnitState[]   
}

export class SimpleGeoJSON {
    type: string
    crs: {
        type: string,
        properties: {
            name: string
        }
    }
    features: {
        type: string,
        geometry: {
            type: string,
            coordinates: number[][][]
        }
    }[]
}

export class LayerState {
    id: number
    params: {
        name: string,
        value: string
    }[]
    opacity: number
    visible: boolean
    expanded: boolean
}

export class AnalysisUnitState {
    layerIds: number[]
    name: string
    analysisType: string
    coordinates: Coordinate | null
    samplingResolution: string | null
    histogramClasses: string | null
    analysisPerformed: boolean
    expanded: boolean
}

export class ContextState {
    startDate: string
    endDate: string
    basemap: number
    limits: number
    areaOfInterest: SimpleGeoJSON
}

export class ScenarioModel {
    id: number
    name: string
    scenario_json: string
}

