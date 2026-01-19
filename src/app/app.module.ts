// src/app/app.module.ts
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // Adicionado FormsModule por precaução
import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// Diretivas e Services
import { CurrencyMaskDirective } from './currency-mask.directive';
import { CalculadoraEGIService } from './calculadora-egi.service';

// Componentes EGI (Novos)
import { CalculadoraEgiComponent } from './calculadora-egi/calculadora-egi.component';
import { CalculadoraEgiFormComponent } from './calculadora-egi-form/calculadora-egi-form.component';

// Componentes Antigos (Remover se não for mais usar)
import { CalculadoraSacPriceComponent } from './calculadora-sac-price/calculadora-sac-price.component';
import { CalculadoraPriceSacFormComponent } from './calculadora-price-sac-form/calculadora-price-sac-form.component';
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
    CalculadoraSacPriceComponent, 
    CalculadoraPriceSacFormComponent
  ],
  imports: [
    BrowserModule, 
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule // Necessário caso use [(ngModel)] em algum lugar
  ],
  providers: [
    CalculadoraEGIService, // Injetando o serviço no módulo
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}