// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Diretivas e Services
import { CurrencyMaskDirective } from './directives/currency-mask.directive';

// Componentes EGI
import { CalculadoraEgiComponent } from './calculadora-egi/calculadora-egi.component';
import { CalculadoraEgiFormComponent } from './calculadora-egi-form/calculadora-egi-form.component';

// Componentes SAC/PRICE
import { CalculadoraPoderCompraComponent } from './calculadora-poder-compra/calculadora-poder-compra.component';
import { CalculadoraPoderCompraFormComponent } from './calculadora-poder-compra-form/calculadora-poder-compra-form.component';

// Novos Componentes de Financiamento com Fase de Obras
import { FinanciamentoObrasComponent } from './financiamento-obras/financiamento-obras/financiamento-obras.component';

import { ImovelPlantaComponent } from './financiamento-obras/imovel-planta/imovel-planta.component';

import { AppRoutingModule } from './app-routing.module';
import { ConstrucaoTerrenoComponent } from './financiamento-obras/construcao-terreno/construcao-terreno.component';
import { TimelineComponent } from './timeline/timeline.component';
import { CetPlanilhaComponent } from './cet-planilha/cet-planilha.component';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AppComponent,
    CurrencyMaskDirective,
    // Componentes EGI
    CalculadoraEgiComponent,
    CalculadoraEgiFormComponent,
    // Componentes SAC/PRICE
    CalculadoraPoderCompraComponent,
    CalculadoraPoderCompraFormComponent,
    // Componentes Financiamento com Fase de Obras
    FinanciamentoObrasComponent,
    ConstrucaoTerrenoComponent,
    ImovelPlantaComponent,
    TimelineComponent,
    CetPlanilhaComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
