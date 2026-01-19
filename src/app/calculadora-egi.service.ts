import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface CalculadoraEGIInput {
  rendaMensal: number;
  valorImovel: number;
  saldoDevedor?: number;
}

export interface CalculadoraEGIResult {
  valorMaximoFinanciavel: number;
  prestacaoMaximaPermitida: number;
  podePortarSaldoDevedor: boolean;
  prestacaoEstimada: number;
  taxaAplicadaAnual: number;
  prazoAplicadoAnos: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalculadoraEGIService {

  calcularEGI(input: CalculadoraEGIInput): CalculadoraEGIResult {
    // Busca parâmetros específicos do EGI no environment
    const taxaJurosAnual = environment.taxaJurosAnualEGI;
    const prazoAnos = environment.prazoAnosEGI;
    
    // Cálculos de conversão
    const nMeses = prazoAnos * 12;
    const taxaJurosMensal = taxaJurosAnual / 12 ;

    // Regras de negócio (LTV 60% e DTI 30%)
    const valorMaximoFinanciavel = input.valorImovel * 0.6;
    const prestacaoMaximaPermitida = input.rendaMensal * 0.3;
    const podePortarSaldoDevedor = !input.saldoDevedor || input.saldoDevedor <= valorMaximoFinanciavel;

    // Definição do PV (Valor Presente)
    const PV = input.saldoDevedor || valorMaximoFinanciavel;

    // Cálculo da Prestação (Fórmula Price)
    let prestacaoEstimada = 0;
    if (taxaJurosMensal > 0) {
      const i = taxaJurosMensal;
      const n = nMeses;
      prestacaoEstimada = PV * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    } else {
      prestacaoEstimada = PV / nMeses;
    }

    return {
      valorMaximoFinanciavel: Number(valorMaximoFinanciavel.toFixed(2)),
      prestacaoMaximaPermitida: Number(prestacaoMaximaPermitida.toFixed(2)),
      podePortarSaldoDevedor,
      prestacaoEstimada: Number(prestacaoEstimada.toFixed(2)),
      taxaAplicadaAnual: taxaJurosAnual,
      prazoAplicadoAnos: prazoAnos
    };
  }
}