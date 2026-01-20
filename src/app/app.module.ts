// src/app/app.module.ts
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // Adicionado FormsModule por precaução
import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Diretivas e Services
import { CurrencyMaskDirective } from './directives/currency-mask.directive';

// Componentes EGI (Novos)
import { CalculadoraEgiComponent } from './calculadora-egi/calculadora-egi.component';
import { CalculadoraEgiFormComponent } from './calculadora-egi-form/calculadora-egi-form.component';

// Componentes Antigos (Remover se não for mais usar)
import { CalculadoraPoderCompraComponent } from './calculadora-poder-compra/calculadora-poder-compra.component';
import { CalculadoraPoderCompraFormComponent } from './calculadora-poder-compra-form/calculadora-poder-compra-form.component';
import { AppRoutingModule } from './app-routing.module';


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
    CalculadoraPoderCompraFormComponent
  ],
  imports: [
    BrowserModule, 
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule // Necessário caso use [(ngModel)] em algum lugar
  ],  
  bootstrap: [AppComponent],
})
export class AppModule {}