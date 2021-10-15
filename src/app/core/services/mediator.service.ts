import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediatorService {

  constructor() { }

  getMetadata(){
  }

  getTimestamps(){
  }

  getDefaultParamValue(param: string){
    let value = null;
    switch(param){
      case "elevation":{
        value = -1.0182366371154785;
        break;
      }

      case "time-daily":{
        let now = new Date();
        // "2021-10-04T12:00:00.000Z"
        value = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + "T12:00:00.000Z";
        break;
      }

      case "time-monthly":{
        let now = new Date();
        // "2021-10-04T12:00:00.000Z"
        value = now.getFullYear() + "-" + (now.getMonth()-1) + "-16T12:00:00.000Z";
        break;
      }

      case "time-hourly":{
        let now = new Date();
        // "2021-10-04T12:00:00.000Z"
        value = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + "T" + now.getHours() + ":30:00.000Z";
        break;
      }

      case "time-15-minutes":{
        let now = new Date();
        // "2021-10-04T12:00:00.000Z"
        value = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + "T" + now.getHours() + ":00:00.000Z";
        break;
      }
    }
    return value;
  }
}
