import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {

  public contextStartDate: Date|null;
  public contextEndDate: Date|null;

  public globalDateTime: Date;
  public globalElevation: number;

  public bbox: string;

  constructor() {
    this.contextStartDate = null;
    this.contextEndDate = null;
  }
}
