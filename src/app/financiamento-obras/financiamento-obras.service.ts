import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Parcela,
  TimelineEtapa,
  TipoModalidade,
  SistemaAmortizacao,
  ModalidadeConfig,
  ResultadoCalculoFinanciamento,
  ValidationResult
} from './financiamento-obras.models';

@Injectable({
  providedIn: 'root'
})
export class FinanciamentoObrasService {

  constructor() {}

  /**
   * Converte taxa efetiva anual em taxa mensal
   * Fórmula: (1 + taxa_anual)^(1/12) - 1
   */
  private converterTaxaAnualParaMensal(taxaEfetiva: number): number {
    return Math.pow(1 + taxaEfetiva, 1/12) - 1;
  }

  /**
   * Obtém configuração da modalidade específica
   */
  private obterConfiguracao(modalidade: TipoModalidade): ModalidadeConfig {
    const config = environment.financiamentoObrasConfig[modalidade];
    if (!config) {
      throw new Error(`Configuração não encontrada para modalidade: ${modalidade}`);
    }
    return config;
  }

  /**
   * Valida entrada de financiamento
   */
  private validarEntrada(
    modalidade: TipoModalidade,
    valorFinanciamento: number,
    prazoAmortizacao: number,
    sistema: SistemaAmortizacao
  ): ValidationResult {
    const config = this.obterConfiguracao(modalidade);
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar valor de financiamento
    if (valorFinanciamento < config.valorFinanciamento.minimo) {
      erros.push(`Valor mínimo de financiamento: R$ ${config.valorFinanciamento.minimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }
    if (valorFinanciamento > config.valorFinanciamento.maximo) {
      erros.push(`Valor máximo de financiamento: R$ ${config.valorFinanciamento.maximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

    // Validar prazo de amortização
    const prazoMin = config.prazoAmortizacao.minimo[sistema];
    const prazoMax = config.prazoAmortizacao.maximo[sistema];
    
    if (prazoAmortizacao < prazoMin) {
      erros.push(`Prazo mínimo de amortização (${sistema}): ${prazoMin} meses`);
    }
    if (prazoAmortizacao > prazoMax) {
      erros.push(`Prazo máximo de amortização (${sistema}): ${prazoMax} meses`);
    }

    return {
      isValido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Método parametrizado: calcula financiamento com parâmetros da modalidade
   * Usa taxa e LTV específicos da modalidade configurada
   */
  calcularFinanciamentoComParametros(
    modalidade: TipoModalidade,
    valorTerreno: number,
    valorObra: number,
    prazoObra: number,
    percentualExecutado: number,
    prazoTotal: number,
    sistema: SistemaAmortizacao
  ): ResultadoCalculoFinanciamento {
    const config = this.obterConfiguracao(modalidade);
    
    // Retirar percentual executado
    valorObra -= valorObra * (percentualExecutado / 100);

    // Aplicar LTV conforme sistema
    const ltv = config.ltv[sistema];
    valorObra = valorObra * ltv;
    valorTerreno = valorTerreno * ltv;

    // Converter taxa anual para mensal
    const taxaJurosMensal = this.converterTaxaAnualParaMensal(config.taxaEfetiva);

    // Calcular valor total de financiamento para validação
    const valorTotalFinanciamento = valorObra + valorTerreno;
    
    // Validar entrada
    const prazoAmortizacao = prazoTotal - prazoObra;
    const validacao = this.validarEntrada(modalidade, valorTotalFinanciamento, prazoAmortizacao, sistema);

    // --- Fase de Obras ---
    const faseObras: Parcela[] = [];
    let acumuladoAnterior = 0;
    
    for (let i = 1; i <= prazoObra; i++) {
      const percentualAcumulado = i / prazoObra;
      let valorAcumulado = valorObra * percentualAcumulado;
      let valorLiberadoMes = valorAcumulado - acumuladoAnterior;

      // Terreno é liberado na primeira parcela
      if (i === 1 && valorTerreno > 0) {
        valorAcumulado = valorTerreno;
      } else {
        valorAcumulado += valorTerreno;
      }

      acumuladoAnterior = valorAcumulado;

      // Parcela = saldo acumulado * taxa mensal
      const valorParcela = valorAcumulado * taxaJurosMensal;

      faseObras.push({
        mes: i,
        valorLiberado: valorLiberadoMes,
        valorLiberadoAcumulado: valorAcumulado,
        valorParcela,
        valorAmortizacao: 0
      });
    }

    // --- Fase de Amortização ---
    const saldoDevedor = valorObra;
    const faseAmortizacao: Parcela[] = [];

    if (sistema === 'PRICE') {
      const parcela = saldoDevedor * (taxaJurosMensal / (1 - Math.pow(1 + taxaJurosMensal, -prazoAmortizacao)));
      let saldo = saldoDevedor;

      for (let i = 1; i <= prazoAmortizacao; i++) {
        const juros = saldo * taxaJurosMensal;
        const amortizacao = parcela - juros;
        saldo -= amortizacao;

        faseAmortizacao.push({
          mes: prazoObra + i,
          valorParcela: parcela,
          valorAmortizacao: amortizacao
        });
      }
    } else {
      const amortizacaoConstante = saldoDevedor / prazoAmortizacao;
      let saldo = saldoDevedor;

      for (let i = 1; i <= prazoAmortizacao; i++) {
        const juros = saldo * taxaJurosMensal;
        const parcela = amortizacaoConstante + juros;
        saldo -= amortizacaoConstante;

        faseAmortizacao.push({
          mes: prazoObra + i,
          valorParcela: parcela,
          valorAmortizacao: amortizacaoConstante
        });
      }
    }

    // --- Totais ---
    const custoTotalObra = faseObras.reduce((acc, p) => acc + p.valorParcela, 0);
    const custoTotalAmortizacao = faseAmortizacao.reduce((acc, p) => acc + p.valorParcela, 0);

    // --- Timeline ---
    const timeline: TimelineEtapa[] = [
      { etapa: 'Início da Obra', mes: 1, data: new Date(), fase: 'Obras' },
      { etapa: 'Fim da Obra', mes: prazoObra, data: new Date(), fase: 'Obras' },
      { etapa: 'Início Amortização', mes: prazoObra + 1, data: new Date(), fase: 'Amortizacao' },
      { etapa: 'Fim Amortização', mes: prazoTotal, data: new Date(), fase: 'Amortizacao' }
    ];

    return {
      faseObras,
      faseAmortizacao,
      custoTotalObra,
      custoTotalAmortizacao,
      cetEfetivo: config.taxaEfetiva,
      taxaJuros: config.taxaEfetiva,
      timeline,
      validacoes: validacao
    };
  }

  /**
   * DEPRECATED: Mantido para compatibilidade com código antigo
   * Use calcularFinanciamentoComParametros() para novos desenvolvimentos
   * Este método usa LTV fixo de 80% e taxa hardcoded
   */
  calcularConstrucaoTerreno(
    valorTerreno: number,
    valorObra: number,
    prazoObra: number,
    percentualExecutado: number,
    prazoTotal: number,
    sistema: 'PRICE' | 'SAC'
  ) {
    // retirar o percentual executado
    valorObra -= valorObra * (percentualExecutado/100);

    // financia até 80% do valor da obra (LTV fixo)
    valorObra = valorObra * 0.8;
    valorTerreno = valorTerreno * 0.8;
    
    // Taxa hardcoded: 7.23% a.a = 0.00584 ao mês
    const taxaJurosMensal = 0.00584;

    // --- Fase de Obras ---
    const faseObras: Parcela[] = [];
    let acumuladoAnterior = 0;
    for (let i = 1; i <= prazoObra; i++) {
      const percentualAcumulado = i / prazoObra;
      let valorAcumulado = valorObra * percentualAcumulado;
      let valorLiberadoMes = valorAcumulado - acumuladoAnterior;
      
      // Valor do terreno é liberado na primeira parcela
      if(i == 1 && valorTerreno > 0){
        valorAcumulado = valorTerreno;
      }
      else{
        valorAcumulado += valorTerreno;
      }             

      acumuladoAnterior = valorAcumulado;

      // Parcela = saldo acumulado * taxa mensal
      const valorParcela = valorAcumulado * taxaJurosMensal;

      faseObras.push({
        mes: i,
        valorLiberado: valorLiberadoMes,
        valorLiberadoAcumulado: valorAcumulado,
        valorParcela,
        valorAmortizacao: 0
      });
    }

    // --- Fase de Amortização ---
    const prazoAmortizacao = prazoTotal - prazoObra;
    const saldoDevedor = valorObra;
    const faseAmortizacao: Parcela[] = [];

    if (sistema === 'PRICE') {
      const parcela = saldoDevedor * (taxaJurosMensal / (1 - Math.pow(1 + taxaJurosMensal, -prazoAmortizacao)));
      let saldo = saldoDevedor;

      for (let i = 1; i <= prazoAmortizacao; i++) {
        const juros = saldo * taxaJurosMensal;
        const amortizacao = parcela - juros;
        saldo -= amortizacao;

        faseAmortizacao.push({
          mes: prazoObra + i,
          valorParcela: parcela,
          valorAmortizacao: amortizacao
        });
      }
    } else {
      const amortizacaoConstante = saldoDevedor / prazoAmortizacao;
      let saldo = saldoDevedor;

      for (let i = 1; i <= prazoAmortizacao; i++) {
        const juros = saldo * taxaJurosMensal;
        const parcela = amortizacaoConstante + juros;
        saldo -= amortizacaoConstante;

        faseAmortizacao.push({
          mes: prazoObra + i,
          valorParcela: parcela,
          valorAmortizacao: amortizacaoConstante
        });
      }
    }

    // --- Totais ---
    const custoTotalObra = faseObras.reduce((acc, p) => acc + p.valorParcela, 0);
    const custoTotalAmortizacao = faseAmortizacao.reduce((acc, p) => acc + p.valorParcela, 0);

    // --- Timeline ---
    const timeline: TimelineEtapa[] = [
      { etapa: 'Início da Obra', mes: 1, data: new Date(), fase: 'Obras' },
      { etapa: 'Fim da Obra', mes: prazoObra, data: new Date(), fase: 'Obras' },
      { etapa: 'Início Amortização', mes: prazoObra + 1, data: new Date(), fase: 'Amortizacao' },
      { etapa: 'Fim Amortização', mes: prazoTotal, data: new Date(), fase: 'Amortizacao' }
    ];

    return {
      faseObras,
      faseAmortizacao,
      custoTotalObra,
      custoTotalAmortizacao,
      cetEfetivo: 0.0723,
      taxaJuros: 0.0723,
      timeline
    };
  }
}
