import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  cropListOfDates(startDate: Date|null, endDate: Date|null, datesList: string[]){
    let datesToReturn = [];
    if(startDate==null || endDate==null){
      return datesList;
    }

    for(let date of datesList){
      // date list format "2019-12-31T12:00:00.000Z"
      let datetimeSplit = date.split("T");
      let dateSplit = datetimeSplit[0].split("-");            

      let current = new Date(parseInt(dateSplit[0]), parseInt(dateSplit[1])-1, parseInt(dateSplit[2]));
      
      if(current >= startDate && current <= endDate){       
        datesToReturn.push(date)
      }
    }
    return datesToReturn;
  }

  //valueList is a matrix. For each row, it contains a list of the values to insert.
  csvStringFromData(headers: string[], valueList: any[][], prevData?: string[]){
    console.log(headers, valueList);
    let csvString = "";
    if(prevData){
      for(let prev of prevData){
        csvString += prev + "\n";
      }
    }

    //Line containing headers
    csvString += headers.join(",");
    csvString += "\n";
    for(let i = 0; i < valueList.length; i++){
      csvString += valueList[i].join(",");
      csvString += "\n";
    }
    console.log(csvString);
    
    return csvString;
  }
  
}
