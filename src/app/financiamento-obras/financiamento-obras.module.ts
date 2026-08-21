import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FinanciamentoObrasRoutingModule } from './financiamento-obras-routing.module';
import { FinanciamentoObrasComponent } from './financiamento-obras/financiamento-obras.component';
import { ConstrucaoTerrenoComponent } from './construcao-terreno/construcao-terreno.component';
import { ImovelPlantaComponent } from './imovel-planta/imovel-planta.component';
import { TerrenoConstrucaoComponent } from './terreno-construcao/terreno-construcao.component';



@NgModule({
  declarations: [
    FinanciamentoObrasComponent,
    ConstrucaoTerrenoComponent,
    ImovelPlantaComponent,
    TerrenoConstrucaoComponent
  ],
  imports: [
    CommonModule,
    FinanciamentoObrasRoutingModule
  ]
})
export class FinanciamentoObrasModule { }
