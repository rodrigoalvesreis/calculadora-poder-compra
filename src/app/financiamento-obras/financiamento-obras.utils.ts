/**
 * Utilitários para Financiamento de Obras
 * 
 * Fornece funções auxiliares para trabalhar com as modalidades de financiamento
 * e seus parâmetros configuráveis
 */

import { environment } from '../../environments/environment';
import { TipoModalidade } from './financiamento-obras.models';

export class FinanciamentoObrasUtils {

  /**
   * Nomes amigáveis para cada modalidade
   */
  static getNomeModalidade(modalidade: TipoModalidade): string {
    const nomes: Record<TipoModalidade, string> = {
      imovelPlanta: 'Imóvel na Planta',
      construcaoTerreno: 'Construção em Terreno Próprio',
      terrenoConstrucao: 'Aquisição de Terreno + Construção'
    };
    return nomes[modalidade];
  }

  /**
   * Obtém a configuração de uma modalidade
   */
  static getConfiguracaoModalidade(modalidade: TipoModalidade) {
    return environment.financiamentoObrasConfig[modalidade];
  }

  /**
   * Obtém taxa anual da modalidade em percentual (ex: 12 para 12%)
   */
  static getTaxaAnualEmPercentual(modalidade: TipoModalidade): number {
    const config = this.getConfiguracaoModalidade(modalidade);
    return config.taxaEfetiva * 100;
  }

  /**
   * Obtém valor mínimo de financiamento formatado em moeda
   */
  static getValorMinimoFormatado(modalidade: TipoModalidade, locale: string = 'pt-BR'): string {
    const config = this.getConfiguracaoModalidade(modalidade);
    return config.valorFinanciamento.minimo.toLocaleString(locale, {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Obtém valor máximo de financiamento formatado em moeda
   */
  static getValorMaximoFormatado(modalidade: TipoModalidade, locale: string = 'pt-BR'): string {
    const config = this.getConfiguracaoModalidade(modalidade);
    return config.valorFinanciamento.maximo.toLocaleString(locale, {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /**
   * Obtém prazos de amortização (mínimo e máximo) para um sistema específico
   */
  static getPrazosAmortizacao(modalidade: TipoModalidade, sistema: 'PRICE' | 'SAC') {
    const config = this.getConfiguracaoModalidade(modalidade);
    return {
      minimo: config.prazoAmortizacao.minimo[sistema],
      maximo: config.prazoAmortizacao.maximo[sistema]
    };
  }

  /**
   * Obtém LTV (Loan-to-Value) para um sistema específico
   */
  static getLTV(modalidade: TipoModalidade, sistema: 'PRICE' | 'SAC'): number {
    const config = this.getConfiguracaoModalidade(modalidade);
    return config.ltv[sistema] * 100; // Retorna em percentual
  }

  /**
   * Valida se um valor está dentro do range permitido
   */
  static isValorValido(modalidade: TipoModalidade, valor: number): boolean {
    const config = this.getConfiguracaoModalidade(modalidade);
    return valor >= config.valorFinanciamento.minimo && valor <= config.valorFinanciamento.maximo;
  }

  /**
   * Valida se um prazo está dentro do range permitido
   */
  static isPrazoValido(modalidade: TipoModalidade, prazo: number, sistema: 'PRICE' | 'SAC'): boolean {
    const prazos = this.getPrazosAmortizacao(modalidade, sistema);
    return prazo >= prazos.minimo && prazo <= prazos.maximo;
  }
}
