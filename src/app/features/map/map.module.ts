import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './pages/map/map.component';
import { DTEMapComponent } from './components/dtemap/dtemap.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { TreeViewComponent } from './components/tree-view/tree-view.component';
import { AnalysisUnitComponent } from './components/analysis-unit/analysis-unit.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TutorialComponent } from './components/tutorial/tutorial.component';


@NgModule({
  declarations: [
    MapComponent,
    DTEMapComponent,
    TreeViewComponent,
    AnalysisUnitComponent, 
    NavbarComponent, TutorialComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
  ]
})
export class MapModule { }
