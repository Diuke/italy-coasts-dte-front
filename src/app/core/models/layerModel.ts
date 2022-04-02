export class LayerModel {
    id: number
    layer_name: string
    readable_name: string
    description: string
    keywords: string
    type: string
    category: {
        id: number,
        name: string
    }
    frequency: string
    units: string
    initial_time_range: string
    final_time_range: string
    parameters: string
    source: string
    service_url: string
    metadata_url: string
    legend_url: string
    more_data_url: string
    copyright: string
}

export class LayerCategory {
    id: number
    layers: LayerModel[]
    name: string
    selected: boolean
}