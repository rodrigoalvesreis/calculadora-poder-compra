import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CalculadoraSacPriceComponent } from './calculadora-sac-price/calculadora-sac-price.component';
import { CalculadoraEgiComponent } from './calculadora-egi/calculadora-egi.component';

const routes: Routes = [
  // Rota Poder de Compra (Antiga sac-price)
  { path: 'poder-compra', component: CalculadoraSacPriceComponent },
  
  // Rota EGI
  { path: 'egi', component: CalculadoraEgiComponent },

  // Rota Padrão: Agora aponta para poder-compra
  { path: '', redirectTo: '/poder-compra', pathMatch: 'full' },

  // Fallback para rotas inexistentes
  { path: '**', redirectTo: '/poder-compra' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }