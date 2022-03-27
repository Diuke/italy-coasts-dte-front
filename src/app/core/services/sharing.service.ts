import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import VectorSource from 'ol/source/Vector';
import { AuthService } from 'src/app/features/map/services/auth.service';
import { ApplicationState } from '../models/applicationState';
import { UrlsService } from './urls.service';

@Injectable({
  providedIn: 'root'
})
export class SharingService {

  constructor(
    private http: HttpClient,
    private urlService: UrlsService,
    private authService: AuthService
  ) { }

  loadUserScenarios(){
    let url = this.urlService.buildUrl("list_scenarios");
    let userToken = this.authService.getToken();
    let headers = new HttpHeaders().set("Authorization", "Bearer " + userToken);
    return this.http.get(url, {headers: headers});
  }

  createScenario(scenarioName: string, scenarioJsonString: string){
    let body = {
      scenario_json: scenarioJsonString,
      name: scenarioName
    };
    let userToken = this.authService.getToken();
    let headers = new HttpHeaders().set("Authorization", "Bearer " + userToken);
    let url = this.urlService.buildUrl("create_scenario");
    return this.http.post(url, body, {headers: headers});
  }

  deleteScenario(scenarioId: number){
    let userToken = this.authService.getToken();
    let headers = new HttpHeaders().set("Authorization", "Bearer " + userToken);
    let url = this.urlService.buildUrl("delete_scenario") + "?id=" + scenarioId.toString();
    return this.http.delete(url, {headers: headers});
  }

  public exampleScenario: ApplicationState = {
    "context": {
        "areaOfInterest": {
            "type": "FeatureCollection",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "EPSG:3857"
                }
            },
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    1030625.4620917239,
                                    5048789.3398272805
                                ],
                                [
                                    1077009.7984150406,
                                    4959090.955160323
                                ],
                                [
                                    1172454.8177891513,
                                    4993846.837340606
                                ],
                                [
                                    1131282.448891478,
                                    5043039.817184694
                                ],
                                [
                                    1030625.4620917239,
                                    5048789.3398272805
                                ]
                            ]
                        ]
                    }
                }
            ]
        },
        "basemap": 1,
        "startDate": "2020-04-01",
        "endDate": "2020-10-01",
        "limits": 2
    },
    "layers": [
        {
            "id": 491,
            "expanded": true,
            "opacity": 100,
            "visible": true,
            "params": [
                {
                    "name": "elevation",
                    "value": "-13.318384170532227"
                },
                {
                    "name": "time",
                    "value": "2020-09-20T12:00:00.000Z"
                }
            ]
        },
        {
            "id": 498,
            "expanded": false,
            "opacity": 100,
            "visible": true,
            "params": [
                {
                    "name": "elevation",
                    "value": "-1.0182366371154785"
                },
                {
                    "name": "time",
                    "value": "2020-10-01T12:00:00.000Z"
                }
            ]
        },
        {
            "id": 490,
            "expanded": false,
            "opacity": 48,
            "visible": true,
            "params": [
                {
                    "name": "elevation",
                    "value": "-1.0182366371154785"
                },
                {
                    "name": "time",
                    "value": "2020-10-01T12:00:00.000Z"
                }
            ]
        },
        {
            "id": 548,
            "expanded": false,
            "opacity": 100,
            "visible": true,
            "params": []
        },
        {
            "id": 549,
            "expanded": false,
            "opacity": 100,
            "visible": false,
            "params": []
        },
        {
            "id": 563,
            "expanded": true,
            "opacity": 28,
            "visible": true,
            "params": [
                {
                    "name": "time",
                    "value": "2020-09-01T12:00:00.000Z"
                },
                {
                    "name": "elevation",
                    "value": "10.0"
                }
            ]
        }
    ],
    "analysisUnits": [
        {
            "layerIds": [
                490
            ],
            "name": "phosphate",
            "analysisType": "1",
            "coordinates": [
                9.547105891919719,
                41.19371102800841
            ],
            "samplingResolution": "0",
            "histogramClasses": "10",
            "analysisPerformed": true,
            "expanded": true
        },
        {
            "layerIds": [
                563,
                491
            ],
            "name": "wind amo",
            "analysisType": "2",
            "coordinates": [
                0,
                0
            ],
            "samplingResolution": "10",
            "histogramClasses": "7",
            "analysisPerformed": true,
            "expanded": false
        }
    ]
};


  buildGeoJsonString(source: VectorSource<any>){
    let geoJson = { 
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: {
          name: "EPSG:3857"
        }
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: source.getFeatures()[0].getGeometry().getCoordinates()
          }
        }
      ]
    };
    
    return geoJson;
  }
}
