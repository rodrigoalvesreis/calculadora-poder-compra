import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CalculadoraPoderCompraComponent } from './calculadora-poder-compra/calculadora-poder-compra.component';
import { CalculadoraEgiComponent } from './calculadora-egi/calculadora-egi.component';
import { FinanciamentoObrasComponent } from './financiamento-obras/financiamento-obras/financiamento-obras.component';

const routes: Routes = [
  // Rota Poder de Compra (Antiga sac-price)
  { path: 'poder-compra', component: CalculadoraPoderCompraComponent },
  
  // Rota EGI
  { path: 'egi', component: CalculadoraEgiComponent },

  // Rota Financiamento com Fase de Obras
  { path: 'financiamento-obras', component: FinanciamentoObrasComponent },

  // Rota Padrão: Agora aponta para poder-compra
  { path: '', redirectTo: '/financiamento-obras', pathMatch: 'full' },

  // Fallback para rotas inexistentes
  { path: '**', redirectTo: '/financiamento-obras' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
