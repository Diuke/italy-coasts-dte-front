import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import {fromLonLat} from 'ol/proj';
import { MapServiceService } from 'src/app/services/map-service.service';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';

@Component({
  selector: 'app-dtemap',
  templateUrl: './dtemap.component.html',
  styleUrls: ['./dtemap.component.scss']
})
export class DTEMapComponent implements OnInit {

  public map: Map;
  mapCenter = fromLonLat([12.489947, 41.902540]); //Centered in Rome
  mapInitialZoom = 6.5;

  constructor(
    private mapService: MapServiceService
  ) { }

  ngOnInit(): void {
    this.initMap();
    this.initLayers();
  }

  initMap(){
    this.map = new Map({
      view: new View({
        center: this.mapCenter,
        zoom: this.mapInitialZoom,
        projection: "EPSG:3857"
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: 'map'
    });
  }

  initLayers(){
    const vectorSource = new VectorSource({
      format: new GeoJSON(),
      url: "https://ows.emodnet-humanactivities.eu/wfs?SERVICE=WFS&VERSION=1.1.0&request=GetFeature&typeName=maritimebnds&OUTPUTFORMAT=json&maxfeatures=1"
    });
    
    const vector = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(0, 0, 255, 1.0)',
          width: 2,
        }),
      }),
    });

    this.map.addLayer(vector);
  }

}
