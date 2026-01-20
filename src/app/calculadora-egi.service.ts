import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface EgiInput {
  valorImovel: number;
  saldoDevedor: number;
  renda: number;
  liquidacaoSimultanea: boolean;
}

export interface EgiOutput {
  valorMaximoFinanciavel: number;
  prestacaoMaximaPermitida: number;
  prestacaoEstimada: number;
  taxaAplicadaAnual: number;
  prazoAplicadoAnos: number;
  erro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EgiCalculatorService {
  private config = environment.egiConfig;

  constructor() {}

  /**
   * Executa o cálculo principal do EGI baseado nas regras de negócio.
   */
 calcular(input: EgiInput): EgiOutput {
    const { valorImovel, saldoDevedor, renda, liquidacaoSimultanea } = input;
    const { limites, cenarios } = this.config;

    let taxaAnual = 0;
    let prazoAnos = 0;
    const prestacaoMaxima = renda * limites.percentualMaximoRenda;

    // --- SELEÇÃO DE CENÁRIO (Mantendo seu código original) ---
    if (saldoDevedor > 0 && liquidacaoSimultanea) {
      prazoAnos = cenarios.liquidacao.prazoAnos;
      if (this.isFaixaBaixa(valorImovel)) {
        return this.retornarErro('Liquidação simultânea não permitida para imóveis até 100k.');
      } else if (this.isFaixaAlta(valorImovel)) {
        taxaAnual = cenarios.liquidacao.taxaAcimaCorte;
      } else {
        return this.retornarErro('Valor do imóvel abaixo do mínimo permitido.');
      }
    }
    else if (saldoDevedor <= 0) {
      prazoAnos = cenarios.quitado.prazoAnos;
      taxaAnual = this.isFaixaBaixa(valorImovel) ? cenarios.quitado.taxaAteCorte : cenarios.quitado.taxaAcimaCorte;
      if (valorImovel < limites.valorMinimoImovel) return this.retornarErro('Valor do imóvel abaixo do mínimo permitido.');
    }
    else {
      prazoAnos = cenarios.financiado.prazoAnos;
      taxaAnual = this.isFaixaBaixa(valorImovel) ? cenarios.financiado.taxaAteCorte : cenarios.financiado.taxaAcimaCorte;
      if (valorImovel < limites.valorMinimoImovel) return this.retornarErro('Valor do imóvel abaixo do mínimo permitido.');
    }

    // --- CÁLCULOS FINANCEIROS ---
    const prazoMeses = prazoAnos * 12;
    const taxaMensalDecimal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

    let tetoImovel = valorImovel * limites.percentualMaximoLtv;
    if (saldoDevedor > 0 && !liquidacaoSimultanea) {
      const equity = valorImovel - saldoDevedor;
      tetoImovel = Math.min(tetoImovel, equity);
    }

    const tetoRenda = this.calcularValorPresente(prestacaoMaxima, taxaMensalDecimal, prazoMeses);
    
    // Define o valor potencial
    let valorMaximoFinanciavel = Math.min(tetoImovel, tetoRenda);

    // --- NOVA REGRA: VALIDAÇÃO DE TICKET MÍNIMO ---
    if (valorMaximoFinanciavel < limites.valorMinimoCredito) {
      return this.retornarErro(`O valor de crédito calculado (${this.arredondar(valorMaximoFinanciavel)}) é inferior ao mínimo permitido de R$ 50.000,00.`);
    }

    const prestacaoEstimada = this.calcularPMT(valorMaximoFinanciavel, taxaMensalDecimal, prazoMeses);

    return {
      valorMaximoFinanciavel: this.arredondar(valorMaximoFinanciavel),
      prestacaoMaximaPermitida: this.arredondar(prestacaoMaxima),
      prestacaoEstimada: this.arredondar(prestacaoEstimada),
      taxaAplicadaAnual: taxaAnual,
      prazoAplicadoAnos: prazoAnos
    };
  }

  // --- HELPERS ---

  private isFaixaBaixa(valor: number): boolean {
    return valor >= this.config.limites.valorMinimoImovel && valor <= this.config.limites.pontoCorteTaxa;
  }

  private isFaixaAlta(valor: number): boolean {
    return valor > this.config.limites.pontoCorteTaxa;
  }

  /**
   * Fórmula PMT (Sistema Price):
   * $PMT = PV \cdot \frac{i \cdot (1 + i)^n}{(1 + i)^n - 1}$
   */
  private calcularPMT(pv: number, i: number, n: number): number {
    if (pv <= 0) return 0;
    if (i === 0) return pv / n;
    return pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  }

  /**
   * Fórmula Valor Presente (PV) a partir de uma prestação (PMT):
   * $PV = PMT \cdot \frac{1 - (1 + i)^{-n}}{i}$
   */
  private calcularValorPresente(pmt: number, i: number, n: number): number {
    if (i === 0) return pmt * n;
    return pmt * ((1 - Math.pow(1 + i, -n)) / i);
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private retornarErro(msg: string): EgiOutput {
    return {
      valorMaximoFinanciavel: 0,
      prestacaoMaximaPermitida: 0,
      prestacaoEstimada: 0,
      taxaAplicadaAnual: 0,
      prazoAplicadoAnos: 0,
      erro: msg
    };
  }
}