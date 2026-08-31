/**
 * Interfaces para configuração parametrizada de financiamento de obras
 */

export type SistemaAmortizacao = 'PRICE' | 'SAC';
export type TipoModalidade = 'imovelPlanta' | 'construcaoTerreno' | 'terrenoConstrucao';

export interface PrazoAmortizacaoConfig {
  minimo: {
    SAC: number;
    PRICE: number;
  };
  maximo: {
    SAC: number;
    PRICE: number;
  };
}

export interface LtvConfig {
  SAC: number;
  PRICE: number;
}

export interface ValorFinanciamentoConfig {
  minimo: number;
  maximo: number;
}

export interface ModalidadeConfig {
  taxaEfetiva: number; // Taxa efetiva anual (ex: 0.12 para 12% a.a)
  ltv: LtvConfig;
  prazoAmortizacao: PrazoAmortizacaoConfig;
  valorFinanciamento: ValorFinanciamentoConfig;
}

export interface FinanciamentoObrasConfigAll {
  imovelPlanta: ModalidadeConfig;
  construcaoTerreno: ModalidadeConfig;
  terrenoConstrucao: ModalidadeConfig;
}

export interface Parcela {
  mes: number;
  valorLiberado?: number; // valor liberado no mês
  valorLiberadoAcumulado?: number; // acumulado até o mês
  valorParcela: number; // parcela considerando juros
  valorAmortizacao: number;
}

export interface TimelineEtapa {
  etapa: string;
  mes: number;
  data: Date;
  fase: 'Obras' | 'Amortizacao';
}

export interface ResultadoCalculoFinanciamento {
  faseObras: Parcela[];
  faseAmortizacao: Parcela[];
  custoTotalObra: number;
  custoTotalAmortizacao: number;
  cetEfetivo: number;
  taxaJuros: number;
  timeline: TimelineEtapa[];
  validacoes: ValidationResult;
}

export interface ValidationResult {
  isValido: boolean;
  erros: string[];
  avisos: string[];
}
