import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit, OnDestroy {

  tutorialActiveSubscription: Subscription;

  //Page number start from 0
  page: number = 0;
  lastPage: number = 5;

  constructor(
    public tutorialService: TutorialService
  ) { }

  ngOnInit(): void {
    this.tutorialActiveSubscription = this.tutorialService.isTutorialActiveChange.subscribe( active => {
      if(!active){
        this.resetTutorial();
      }
    })
  }

  ngOnDestroy(): void {
    this.tutorialActiveSubscription.unsubscribe();
  }

  resetTutorial(){
    this.page = 0;
  }

  nextPage(){
    let newPage = this.page - 1;
    this.page = newPage < 0 ? 0 : newPage;
  }

  previousPage(){
    let newPage = this.page + 1;
    this.page = newPage > this.lastPage ? this.lastPage : newPage;
  }

  closeTutorial(){
    this.tutorialService.deactiveTutorial();
  }

}
