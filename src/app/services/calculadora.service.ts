import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Interface que define a estrutura do retorno dos cálculos.
 * Centraliza as informações necessárias para exibição em UI e contratos.
 */
export interface ResultadoCalculo {
  valorImovel: number;
  valorFinanciado: number;
  valorEntrada: number;
  outrasDespesas: number; // ITBI, Registro e Custas cartorárias
  jurosEfetivo: number;   // Taxa de juros real após capitalização
  primeiraParcela: number;
  ultimaParcela: number;
  rendaNecessaria: number;
  limitado: boolean;      // Indica se o valor foi restringido por teto de renda ou faixa
  sistema: 'sac' | 'price';
}

// Constantes de mercado
const TAXA_BALCAO = 0.1092; // caso não consiga ler do environment
const PERCENTUAL_COMPROMETIMENTO = 0.3; // Limite de 30% da renda mensal bruta

@Injectable({ providedIn: 'root' })
export class CalculadoraService {
  private faixas = environment.poderCompraConfig.faixas;
  private prazoAnos = environment.poderCompraConfig.prazoAnos;

  private readonly PERCENTUAL_FINANCIADO = 0.8; 
  private readonly PERCENTUAL_DESPESAS = 0.05;

  /**
   * Converte taxa Anual para Mensal utilizando juros compostos.
   * Fórmula: (1 + i_a) = (1 + i_m)^12
   * @param ia Taxa de juros Anual em formato decimal (ex: 0.10)
   * @returns Taxa de juros mensal equivalente
   */
  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;

  /**
   * Define o sistema de amortização baseado na taxa de juros.
   * Estratégia: Taxas maiores (Balcão) utilizam SAC para amortização mais rápida.
   * @param taxaEfetiva Taxa anual efetiva da simulação
   * @returns 'sac' ou 'price'
   */
  private definirSistema(taxaEfetiva: number): 'sac' | 'price' {
    return taxaEfetiva >= TAXA_BALCAO ? 'sac' : 'price';
  }

  /**
   * Cálculo das parcelas baseado no sistema escolhido (SAC ou Price).
   * @param pv Valor Presente / Montante Financiado (Present Value)
   * @param taxaMensal Taxa de juros mensal em decimal
   * @param n Prazo total em meses (Number of periods)
   * @param sistema Sistema de amortização selecionado
   * @returns Objeto contendo o valor da primeira e da última parcela
   */
  private calcularParcelas(pv: number, taxaMensal: number, n: number, sistema: 'sac' | 'price') {
    if (n <= 0 || pv <= 0) return { primeira: 0, ultima: 0 };

    if (sistema === 'price') {
      const valor = taxaMensal === 0 ? pv / n : pv * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -n)));
      return { primeira: valor, ultima: valor };
    }

    const amortizacao = pv / n;
    return {
      primeira: amortizacao + (pv * taxaMensal),
      ultima: amortizacao + (amortizacao * taxaMensal)
    };
  }

  /**
   * Identifica o índice da faixa de juros com base nos limites de imóvel ou renda.
   * @param valor Valor a ser testado contra as faixas
   * @param tipo Define se o valor refere-se a 'imovel' ou 'renda'
   * @returns Índice da faixa encontrada no array de configurações
   */
  private getFaixaIndex(valor: number, tipo: 'imovel' | 'renda'): number {
    const campo = tipo === 'imovel' ? 'limiteImovel' : 'limiteRenda';
    const idx = this.faixas.findIndex(f => valor <= f[campo]);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  /**
   * Simulação principal: Avalia viabilidade de um imóvel vs renda informada.
   * @param valorImovel Valor total de avaliação do imóvel
   * @param renda Renda mensal bruta do proponente
   * @param prazoAnosManual Prazo opcional para sobrescrever o padrão
   * @returns Objeto estruturado com todos os custos e limites da simulação
   */
  public calcularFinanciamentoImovelRenda(
    valorImovel: number,
    renda: number,
    prazoAnosManual?: number
  ): ResultadoCalculo {
    const prazo = prazoAnosManual || this.prazoAnos;
    const meses = Math.trunc(prazo * 12);

    if (valorImovel <= 0 || renda <= 0) return this.gerarResultadoVazio();

    const idxFinal = Math.max(
      this.getFaixaIndex(valorImovel, 'imovel'),
      this.getFaixaIndex(renda, 'renda')
    );

    const taxaEfetiva = this.faixas[idxFinal]?.taxaEfetiva ?? TAXA_BALCAO;
    const taxaMensal = this.taxaAaParaAm(taxaEfetiva);
    const sistema = this.definirSistema(taxaEfetiva);

    let valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    let parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);
    const parcelaMaximaRenda = renda * PERCENTUAL_COMPROMETIMENTO;

    if (parcelas.primeira > parcelaMaximaRenda) {
      if (sistema === 'price') {
        valorFinanciado = taxaMensal === 0
          ? parcelaMaximaRenda * meses
          : parcelaMaximaRenda * (1 - Math.pow(1 + taxaMensal, -meses)) / taxaMensal;
      } else {
        valorFinanciado = parcelaMaximaRenda / ((1 / meses) + taxaMensal);
      }
      parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);
    }

    return this.formatarResultado({
      valorImovel, valorFinanciado, taxaEfetiva, taxaMensal, parcelas, sistema,
      rendaNecessaria: renda,
      limitado: parcelas.primeira > parcelaMaximaRenda
    });
  }

  /**
   * Ponto de entrada genérico para diferentes fluxos de simulação.
   * @param valor Valor monetário de entrada (Imóvel, Renda ou Prestação)
   * @param tipo Categoria do valor informado
   * @param prazoAnosManual Prazo customizado em anos
   * @returns Resultado completo da simulação
   */
  calcularFinanciamento(
    valor: number,
    tipo: 'imovel' | 'renda' | 'prestacao',
    prazoAnosManual?: number,
  ): ResultadoCalculo {
    const prazo = prazoAnosManual || this.prazoAnos;
    const prazoMeses = Math.trunc(prazo * 12);

    switch (tipo) {
      case 'imovel': return this.processarFluxoImovel(valor, prazoMeses);
      case 'renda': return this.processarFluxoRenda(valor, prazoMeses);
      case 'prestacao': return this.processarFluxoPrestacao(valor, prazoMeses);
      default: return this.gerarResultadoVazio();
    }
  }

  /**
   * Processa a simulação baseada no valor do imóvel. Realiza loop de convergência
   * para alinhar a renda necessária com a faixa de juros correta.
   * @param valorImovel Preço de venda/avaliação
   * @param meses Prazo total em meses
   */
  private processarFluxoImovel(valorImovel: number, meses: number): ResultadoCalculo {
    const valorFinanciadoBase = valorImovel * this.PERCENTUAL_FINANCIADO;
    const idxBase = this.getFaixaIndex(valorImovel, 'imovel');

    let idxAtual = idxBase;
    let taxaEfetiva = 0, taxaMensal = 0, sistema: 'sac' | 'price' = 'sac';
    let parcelas = { primeira: 0, ultima: 0 };

    for (let i = 0; i < this.faixas.length; i++) {
      taxaEfetiva = this.faixas[idxAtual]?.taxaEfetiva ?? TAXA_BALCAO;
      taxaMensal = this.taxaAaParaAm(taxaEfetiva);
      sistema = this.definirSistema(taxaEfetiva);
      
      parcelas = this.calcularParcelas(valorFinanciadoBase, taxaMensal, meses, sistema);

      const rendaNecessaria = parcelas.primeira / PERCENTUAL_COMPROMETIMENTO;
      const idxRenda = this.getFaixaIndex(rendaNecessaria, 'renda');
      const novoIdx = Math.max(idxBase, idxRenda);

      if (novoIdx === idxAtual) break;
      idxAtual = novoIdx;
    }

    return this.formatarResultado({
      valorImovel, 
      valorFinanciado: valorFinanciadoBase, 
      taxaEfetiva, 
      taxaMensal, 
      parcelas, 
      sistema,
      rendaNecessaria: parcelas.primeira / PERCENTUAL_COMPROMETIMENTO
    });
  }

  /**
   * Processa a simulação "Quanto eu posso comprar?" baseada na renda bruta.
   * @param renda Renda bruta mensal
   * @param meses Prazo total em meses
   */
  private processarFluxoRenda(renda: number, meses: number): ResultadoCalculo {
    const idxRenda = this.getFaixaIndex(renda, 'renda');
    const taxaEfetiva = this.faixas[idxRenda]?.taxaEfetiva ?? TAXA_BALCAO;
    const taxaMensal = this.taxaAaParaAm(taxaEfetiva);
    const sistema = this.definirSistema(taxaEfetiva);
    const parcelaMax = renda * PERCENTUAL_COMPROMETIMENTO;

    let valorFinanciado = 0;
    if (sistema === 'price') {
      valorFinanciado = taxaMensal === 0 ? parcelaMax * meses : parcelaMax * (1 - Math.pow(1 + taxaMensal, -meses)) / taxaMensal;
    } else {
      valorFinanciado = parcelaMax / ((1 / meses) + taxaMensal);
    }

    let valorImovel = valorFinanciado / this.PERCENTUAL_FINANCIADO;
    let limitado = false;
    const limiteFaixa = this.faixas[idxRenda]?.limiteImovel ?? Infinity;

    if (valorImovel > limiteFaixa) {
      limitado = true;
      valorImovel = limiteFaixa;
      valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    }

    const parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);

    return this.formatarResultado({
      valorImovel, valorFinanciado, taxaEfetiva, taxaMensal, parcelas, sistema, limitado,
      rendaNecessaria: renda
    });
  }

  /**
   * Calcula o cenário baseado no valor de prestação desejada pelo usuário.
   * @param parcela Valor da primeira prestação alvo
   * @param meses Prazo total em meses
   */
  private processarFluxoPrestacao(parcela: number, meses: number): ResultadoCalculo {
    const renda = parcela / PERCENTUAL_COMPROMETIMENTO;
    return this.processarFluxoRenda(renda, meses);
  }

  /**
   * Aplica arredondamentos financeiros e formata o objeto final de retorno.
   * @param dados Objeto contendo os dados brutos do cálculo
   */
  private formatarResultado(dados: any): ResultadoCalculo {
    return {
      valorImovel: Number(dados.valorImovel.toFixed(2)),
      valorFinanciado: Number(dados.valorFinanciado.toFixed(2)),
      valorEntrada: Number((dados.valorImovel - dados.valorFinanciado).toFixed(2)),
      outrasDespesas: Number((dados.valorImovel * this.PERCENTUAL_DESPESAS).toFixed(2)),
      jurosEfetivo: Number(dados.taxaEfetiva.toFixed(4)),
      primeiraParcela: Number(dados.parcelas.primeira.toFixed(2)),
      ultimaParcela: Number(dados.parcelas.ultima.toFixed(2)),
      rendaNecessaria: Number(dados.rendaNecessaria.toFixed(2)),
      limitado: dados.limitado || false,
      sistema: dados.sistema
    };
  }

  /**
   * Gera um objeto de resultado zerado para casos de erro ou inputs inválidos.
   */
  gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorImovel: 0,
      valorFinanciado: 0,
      valorEntrada: 0,
      outrasDespesas:0,
      jurosEfetivo: 0,
      primeiraParcela: 0,
      ultimaParcela: 0,
      rendaNecessaria: 0,
      limitado: false,
      sistema: 'price'
    }
  }
}