
// src/app/app.module.ts
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { CurrencyMaskDirective } from './currency-mask.directive';
import { CalculadoraSacPriceComponent } from './calculadora-sac-price/calculadora-sac-price.component';
import { CalculadoraPriceSacInputComponent } from './calculadora-price-sac-input/calculadora-price-sac-input.component';
registerLocaleData(localePt);

@NgModule({
  declarations: [AppComponent, CurrencyMaskDirective, CalculadoraSacPriceComponent, CalculadoraPriceSacInputComponent],
  imports: [BrowserModule, ReactiveFormsModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
``
