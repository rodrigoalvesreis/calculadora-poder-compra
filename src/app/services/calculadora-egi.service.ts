import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Interface que define a estrutura do retorno dos cálculos do CGI (Crédito com Garantia de Imóvel).
 */
export interface ResultadoCalculo {
  /** Valor final aprovado (o menor entre o limite da garantia e o limite da renda). */
  valorMaximoFinanciavel: number;
  /** Representa o teto bruto baseado no LTV (Quota de Financiamento) de 60% do imóvel. */
  valorGarantia: number;
  /** Teto bruto da operação (Equivalente ao valor da garantia). */
  valorMaximoEGI: number;
  /** Valor máximo da parcela com base na margem de comprometimento de renda (30%). */
  prestacaoMaximaPermitida: number;
  /** Valor da parcela mensal estimado para o montante máximo financiavel. */
  prestacaoEstimada: number;
  /** Taxa de juros anual aplicada (em formato decimal). */
  taxaAplicadaAnual: number;
  /** Prazo total da operação em anos. */
  prazoAplicadoAnos: number;
  /** Descritivo de erro caso alguma regra de negócio impeça a simulação. */
  erro?: string;
}

@Injectable({ providedIn: 'root' })
export class EgiCalculatorService {
  /** Configurações centralizadas vindas do ambiente. */
  private config = environment.egiConfig;

  /**
   * Converte uma taxa de juros Anual (a.a.) para Mensal (a.m.) via capitalização composta.
   * * @param taxaAnual Taxa anual em decimal (ex: 0.15 para 15%).
   * @returns Taxa mensal equivalente em decimal.
   */
  private taxaAaParaAm = (taxaAnual: number): number => Math.pow(1 + taxaAnual, 1 / 12) - 1;

  /**
   * Formata o valor numérico para o padrão monetário (duas casas decimais).
   * * @param valor Valor bruto.
   * @returns Valor arredondado.
   */
  private formatarMoeda(valor: number): number {
    return Number(valor.toFixed(2));
  }

  /**
   * Calcula o valor da prestação mensal usando a fórmula da Tabela Price.
   * * @param valorPresente Montante total do empréstimo.
   * @param taxaMensal Taxa de juros mensal (decimal).
   * @param totalMeses Prazo total em meses.
   * @returns Valor da prestação mensal fixa.
   */
  private calcularPrestacao(valorPresente: number, taxaMensal: number, totalMeses: number): number {
    if (valorPresente <= 0 || totalMeses <= 0) return 0;
    if (taxaMensal === 0) return valorPresente / totalMeses;
    return valorPresente * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -totalMeses)));
  }

  /**
   * Calcula o Valor Presente (Capacidade de Empréstimo) a partir de uma parcela alvo.
   * * @param parcela Valor da parcela (limite de renda).
   * @param taxaMensal Taxa de juros mensal (decimal).
   * @param totalMeses Prazo total em meses.
   * @returns Valor máximo de crédito que a renda suporta.
   */
  private calcularValorMaximoPelaRenda(parcela: number, taxaMensal: number, totalMeses: number): number {
    if (taxaMensal === 0) return parcela * totalMeses;
    return parcela * ((1 - Math.pow(1 + taxaMensal, -totalMeses)) / taxaMensal);
  }

  /**
   * Executa a simulação principal do Home Equity / CGI.
   * * @param valorImovel Valor de avaliação do imóvel.
   * @param saldoDevedor Valor de dívida atual sobre o imóvel (será abatido da garantia).
   * @param renda Renda bruta mensal para cálculo de margem.
   * @param liquidacaoSimultanea Define se o objetivo é quitar dívidas com taxas reduzidas.
   * @returns Objeto {@link ResultadoCalculo} com o detalhamento da operação.
   */
  public calcular(valorImovel: number, saldoDevedor: number, renda: number, liquidacaoSimultanea: boolean): ResultadoCalculo {
    const { limites, cenarios } = this.config;

    if (valorImovel <= 0 || renda <= 0) {
      return this.gerarResultadoVazio();
    }

    // --- Lógica de Garantia (LTV de 60%) ---
    const baseGarantiaEGI = valorImovel * 0.60; 
    const estaAbaixoCorteEGI = baseGarantiaEGI <= limites.pontoCorteTaxa;

    let taxaAnual = 0;
    let prazoAnos = 0;
    let erroSimulacao: string | undefined = undefined;

    // 1. Definição de Cenário e Enquadramento de Taxas
    if (liquidacaoSimultanea) {
      prazoAnos = saldoDevedor > 0 ? cenarios.financiado.prazoAnos : cenarios.liquidacao.prazoAnos;
      taxaAnual = cenarios.liquidacao.taxaAcimaCorte;
      
      if (estaAbaixoCorteEGI) {
        erroSimulacao = 'Liquidação simultânea não permitida para operações com teto de garantia até R$ 100.000,00.';
      }
    } else {
      const cenario = (saldoDevedor || 0) <= 0 ? cenarios.quitado : cenarios.financiado;
      prazoAnos = cenario.prazoAnos;
      taxaAnual = estaAbaixoCorteEGI ? cenario.taxaAteCorte : cenario.taxaAcimaCorte;

      if (valorImovel < limites.valorMinimoCredito) {
        erroSimulacao = `Valor do imóvel abaixo do mínimo de R$ ${limites.valorMinimoCredito.toLocaleString('pt-BR')}.`;
      }
    }

    const meses = Math.trunc(prazoAnos * 12);
    const taxaMensal = this.taxaAaParaAm(taxaAnual);

    // 2. Cálculo do Valor Líquido (Garantia menos a dívida existente)
    const valorDisponivelGarantia = Math.max(0, baseGarantiaEGI - (saldoDevedor || 0));

    // 3. Capacidade de Pagamento (Baseado na Margem Consignável)
    const prestacaoMaxima = renda * limites.percentualMaximoRenda;
    const tetoRenda = this.calcularValorMaximoPelaRenda(prestacaoMaxima, taxaMensal, meses);

    // 4. Determinação do Valor Potencial (Menor entre Garantia e Renda)
    const valorPotencial = Math.min(valorDisponivelGarantia, tetoRenda);

    // Validação de Ticket Mínimo de Crédito (Geralmente R$ 50.000,00)
    if (!erroSimulacao && valorPotencial < limites.valorMinimoCredito) {
      erroSimulacao = `Crédito Máximo insuficiente: R$ ${this.formatarMoeda(valorPotencial).toLocaleString('pt-BR')} é inferior ao mínimo de R$ 50.000,00.`;
    }

    const prestacaoEstimada = this.calcularPrestacao(valorPotencial, taxaMensal, meses);

    return {
      valorMaximoFinanciavel: this.formatarMoeda(valorPotencial),
      valorGarantia: this.formatarMoeda(baseGarantiaEGI),
      valorMaximoEGI: this.formatarMoeda(baseGarantiaEGI),
      prestacaoMaximaPermitida: this.formatarMoeda(prestacaoMaxima),
      prestacaoEstimada: this.formatarMoeda(prestacaoEstimada),
      taxaAplicadaAnual: taxaAnual,
      prazoAplicadoAnos: prazoAnos,
      erro: erroSimulacao
    };
  }

  /**
   * Retorna um objeto zerado para casos de entrada nula ou erro inicial.
   */
  private gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorMaximoFinanciavel: 0, valorGarantia: 0, valorMaximoEGI: 0,
      prestacaoMaximaPermitida: 0, prestacaoEstimada: 0,
      taxaAplicadaAnual: 0, prazoAplicadoAnos: 0
    };
  }
}