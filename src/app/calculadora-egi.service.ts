
import { Injectable } from '@angular/core';

export interface CalculadoraEGIInput {
  rendaMensal: number;       // Renda bruta mensal do cliente
  valorImovel: number;       // Valor do imóvel
  saldoDevedor?: number;     // Saldo devedor (opcional)
  prazoMeses?: number;       // Prazo desejado (opcional, padrão: 240)
  taxaJurosAnual?: number;   // Taxa de juros anual (opcional, padrão: 12%)
}

export interface CalculadoraEGIResult {
  valorMaximoFinanciavel: number;
  prestacaoMaximaPermitida: number;
  podePortarSaldoDevedor: boolean;
  prestacaoEstimada: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalculadoraEGIService {

  calcularEGI(input: CalculadoraEGIInput): CalculadoraEGIResult {
    // Parâmetros padrão
    const prazo = input.prazoMeses || 240;
    const taxaJurosAnual = input.taxaJurosAnual || 12;
    const taxaJurosMensal = taxaJurosAnual / 12 / 100;

    // Valor máximo financiável: 60% do valor do imóvel
    const valorMaximoFinanciavel = input.valorImovel * 0.6;

    // Prestação máxima permitida: 30% da renda mensal
    const prestacaoMaximaPermitida = input.rendaMensal * 0.3;

    // Pode portar saldo devedor?
    const podePortarSaldoDevedor = !input.saldoDevedor || input.saldoDevedor <= valorMaximoFinanciavel;

    // Prestação estimada (Fórmula de financiamento Price)
    // PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
    const PV = input.saldoDevedor || valorMaximoFinanciavel;
    const n = prazo;
    const i = taxaJurosMensal;
    const prestacaoEstimada = PV * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    return {
      valorMaximoFinanciavel,
      prestacaoMaximaPermitida,
      podePortarSaldoDevedor,
      prestacaoEstimada
    };
  }
}