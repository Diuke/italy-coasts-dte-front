import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  //Tutorial inactive by default
  private _isTutorialActive: boolean = false;
  public get isTutorialActive(): boolean {
    return this._isTutorialActive;
  }
  public set isTutorialActive(val: boolean){
    this._isTutorialActive = val;
    this.isTutorialActiveChange.next(this._isTutorialActive);
  } 
  isTutorialActiveChange: Subject<boolean> = new Subject();


  constructor() { }

  activateTutorial(){
    this.isTutorialActive = true;
  }

  deactiveTutorial(){
    this.isTutorialActive = false;
  }
}
