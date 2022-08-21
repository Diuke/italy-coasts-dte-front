import { Component, Input, OnInit } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  _questionIcon = faQuestionCircle;

  constructor(
    private tutorialService: TutorialService
  ) { }

  ngOnInit(): void {
  }

  activateTutorial(){
    this.tutorialService.activateTutorial();
  }

}
