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
  jurosEfetivo: number;   // Taxa de juros real anual
  primeiraParcela: number;
  ultimaParcela: number;
  rendaNecessaria: number;
  limitado: boolean;      // Indica se o valor foi restringido por teto de renda ou faixa
  sistema: 'sac' | 'price';
}

const TAXA_BALCAO_LIMITE = 0.1092; 
const PERCENTUAL_COMPROMETIMENTO = 0.3;

@Injectable({ providedIn: 'root' })
export class CalculadoraService {
  private faixas = environment.poderCompraConfig.faixas;
  private prazoAnos = environment.poderCompraConfig.prazoAnos;

  private readonly PERCENTUAL_FINANCIADO = 0.8; // LTV padrão (80%)
  private readonly PERCENTUAL_DESPESAS = 0.05;   // Estimativa de taxas cartoriais e ITBI

  /**
   * Converte taxa Anual para Mensal utilizando juros compostos.
   * @param {number} ia - Taxa de juros Anual em formato decimal.
   * @returns {number} Taxa de juros mensal equivalente.
   */
  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;

  /**
   * Define o sistema de amortização baseado no patamar da taxa de juros.
   * Estratégia: Taxas maiores (Balcão/SBPE) costumam utilizar SAC.
   * @param {number} taxaEfetiva - Taxa anual efetiva da simulação.
   * @returns {'sac' | 'price'} O sistema de amortização selecionado.
   */
  private definirSistema(taxaEfetiva: number): 'sac' | 'price' {
    return taxaEfetiva >= TAXA_BALCAO_LIMITE ? 'sac' : 'price';
  }

  /**
   * Realiza o cálculo matemático das parcelas (Primeira e Última).
   * @param {number} pv - Valor Presente / Montante Financiado.
   * @param {number} taxaMensal - Taxa de juros mensal em decimal.
   * @param {number} n - Prazo total em meses.
   * @param {'sac' | 'price'} sistema - Sistema de amortização escolhido.
   * @returns {Object} Objeto contendo o valor da primeira e da última parcela.
   */
  private calcularParcelas(pv: number, taxaMensal: number, n: number, sistema: 'sac' | 'price') {
    if (n <= 0 || pv <= 0) return { primeira: 0, ultima: 0 };

    if (sistema === 'price') {
      // Fórmula Price: R = PV * [i / (1 - (1+i)^-n)]
      const valor = taxaMensal === 0 ? pv / n : pv * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -n)));
      return { primeira: valor, ultima: valor };
    }

    // Lógica SAC: Amortização constante + juros sobre o saldo devedor
    const amortizacao = pv / n;
    return {
      primeira: amortizacao + (pv * taxaMensal),
      ultima: amortizacao + (amortizacao * taxaMensal)
    };
  }

  /**
   * Busca o índice da faixa de juros correspondente no environment.
   * @param {number} valor - Valor a ser testado (Imóvel ou Renda).
   * @param {'imovel' | 'renda'} tipo - Define qual critério de limite usar.
   * @returns {number} Índice da faixa encontrada no array de configurações.
   */
  private getFaixaIndex(valor: number, tipo: 'imovel' | 'renda'): number {
    const campo = tipo === 'imovel' ? 'limiteImovel' : 'limiteRenda';
    const idx = this.faixas.findIndex(f => valor <= f[campo]);
    // Se não encontrar (valor muito alto), retorna a última faixa (Balcão)
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  /**
   * FLUXO VIABILIDADE: Avalia um imóvel específico contra uma renda informada.
   * Comportamento: Respeita o valor do imóvel e rebaixa o financiamento se a renda for insuficiente.
   * @param {number} valorImovel - Valor total de avaliação do imóvel.
   * @param {number} renda - Renda mensal bruta do proponente.
   * @param {number} [prazoAnosManual] - Prazo opcional para sobrescrever o padrão.
   * @returns {ResultadoCalculo} Objeto estruturado com o resultado da simulação.
   */
  public calcularFinanciamentoImovelRenda(
    valorImovel: number,
    renda: number,
    prazoAnosManual?: number
  ): ResultadoCalculo {
    const prazo = prazoAnosManual || this.prazoAnos;
    const meses = Math.trunc(prazo * 12);

    if (valorImovel <= 0 || renda <= 0) return this.gerarResultadoVazio();

    // Identifica a faixa baseada no valor mais restritivo (Imóvel ou Renda)
    const idxFinal = Math.max(
      this.getFaixaIndex(valorImovel, 'imovel'),
      this.getFaixaIndex(renda, 'renda')
    );

    const taxaEfetiva = this.faixas[idxFinal]?.taxaEfetiva ?? 0.1149;
    const taxaMensal = this.taxaAaParaAm(taxaEfetiva);
    const sistema = this.definirSistema(taxaEfetiva);

    let valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    let parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);
    const parcelaMaximaRenda = renda * PERCENTUAL_COMPROMETIMENTO;

    let limitado = false;
    // Se a parcela do imóvel desejado excede 30% da renda, reduzimos o valor financiado
    if (parcelas.primeira > parcelaMaximaRenda) {
      limitado = true;
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
      rendaNecessaria: renda, limitado
    });
  }

  /**
   * Ponto de entrada genérico para simulações (Imóvel, Renda ou Prestação).
   * @param {number} valor - Valor monetário de entrada.
   * @param {'imovel' | 'renda' | 'prestacao'} tipo - Categoria do valor.
   * @param {number} [prazoAnosManual] - Prazo customizado em anos.
   * @returns {ResultadoCalculo} Resultado completo da simulação.
   */
  public calcularFinanciamento(
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
   * FLUXO PODER DE COMPRA: Calcula o valor máximo de imóvel baseado na renda.
   * Comportamento: Se o valor do imóvel ultrapassar o limite da faixa, sobe para juros maiores.
   * @param {number} renda - Renda bruta mensal.
   * @param {number} meses - Prazo total em meses.
   * @returns {ResultadoCalculo} Resultado com o valor máximo possível.
   */
  private processarFluxoRenda(renda: number, meses: number): ResultadoCalculo {
    let idxAtual = this.getFaixaIndex(renda, 'renda');
    let taxaEfetiva = 0, taxaMensal = 0, valorFinanciado = 0, valorImovel = 0;
    let sistema: 'sac' | 'price' = 'price';
    
    const parcelaMax = renda * PERCENTUAL_COMPROMETIMENTO;

    // Loop de convergência: sobe de faixa até o valor do imóvel caber no limite da faixa de juros
    for (let i = idxAtual; i < this.faixas.length; i++) {
      idxAtual = i;
      taxaEfetiva = this.faixas[idxAtual]?.taxaEfetiva ?? 0.1149;
      taxaMensal = this.taxaAaParaAm(taxaEfetiva);
      sistema = this.definirSistema(taxaEfetiva);

      if (sistema === 'price') {
        valorFinanciado = taxaMensal === 0 
          ? parcelaMax * meses 
          : parcelaMax * (1 - Math.pow(1 + taxaMensal, -meses)) / taxaMensal;
      } else {
        valorFinanciado = parcelaMax / ((1 / meses) + taxaMensal);
      }

      valorImovel = valorFinanciado / this.PERCENTUAL_FINANCIADO;
      const limiteFaixaImovel = this.faixas[idxAtual]?.limiteImovel ?? Infinity;

      // Critério de parada: se o imóvel calculado respeita o teto da faixa de juros atual
      if (valorImovel <= limiteFaixaImovel || idxAtual === this.faixas.length - 1) break;
    }

    const parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);

    return this.formatarResultado({
      valorImovel, valorFinanciado, taxaEfetiva, taxaMensal, parcelas, sistema,
      rendaNecessaria: renda, limitado: false
    });
  }

  /**
   * Atalho para processar o fluxo de renda a partir de uma prestação alvo.
   * @param {number} parcela - Valor da primeira prestação desejada.
   * @param {number} meses - Prazo total em meses.
   * @returns {ResultadoCalculo} Resultado do poder de compra.
   */
  private processarFluxoPrestacao(parcela: number, meses: number): ResultadoCalculo {
    const renda = parcela / PERCENTUAL_COMPROMETIMENTO;
    return this.processarFluxoRenda(renda, meses);
  }

  /**
   * Processa a viabilidade baseada apenas no preço do imóvel (Inverso).
   * @param {number} valorImovel - Preço de venda/avaliação.
   * @param {number} meses - Prazo total em meses.
   * @returns {ResultadoCalculo} Resultado com a renda mínima necessária.
   */
  private processarFluxoImovel(valorImovel: number, meses: number): ResultadoCalculo {
    const valorFinanciadoBase = valorImovel * this.PERCENTUAL_FINANCIADO;
    const idxBase = this.getFaixaIndex(valorImovel, 'imovel');

    let idxAtual = idxBase;
    let taxaEfetiva = 0, taxaMensal = 0, sistema: 'sac' | 'price' = 'sac';
    let parcelas = { primeira: 0, ultima: 0 };

    // Loop para estabilizar a taxa baseada na renda necessária gerada pelo valor do imóvel
    for (let i = 0; i < this.faixas.length; i++) {
      taxaEfetiva = this.faixas[idxAtual]?.taxaEfetiva ?? 0.1149;
      taxaMensal = this.taxaAaParaAm(taxaEfetiva);
      sistema = this.definirSistema(taxaEfetiva);
      parcelas = this.calcularParcelas(valorFinanciadoBase, taxaMensal, meses, sistema);

      const rendaNecessaria = parcelas.primeira / PERCENTUAL_COMPROMETIMENTO;
      const idxRenda = this.getFaixaIndex(rendaNecessaria, 'renda');
      const novoIdx = Math.max(idxBase, idxRenda);

      if (novoIdx === idxAtual) break; // Convergência atingida
      idxAtual = novoIdx;
    }

    return this.formatarResultado({
      valorImovel, valorFinanciado: valorFinanciadoBase, taxaEfetiva, taxaMensal,
      parcelas, sistema, rendaNecessaria: parcelas.primeira / PERCENTUAL_COMPROMETIMENTO
    });
  }

  /**
   * Aplica arredondamentos financeiros e gera o objeto final de resposta.
   * @param {any} dados - Objeto contendo os dados brutos.
   * @returns {ResultadoCalculo} Objeto final formatado para a UI.
   */
  private formatarResultado(dados: any): ResultadoCalculo {
    return {
      valorImovel: Number(dados.valorImovel.toFixed(2)),
      valorFinanciado: Number(dados.valorFinanciado.toFixed(2)),
      valorEntrada: Number((dados.valorImovel - dados.valorFinanciado).toFixed(2)),
      outrasDespesas: Number((dados.valorImovel * this.PERCENTUAL_DESPESAS).toFixed(2)),
      jurosEfetivo: Number(dados.taxaEfetiva.toFixed(6)), // 6 casas para precisão de taxas
      primeiraParcela: Number(dados.parcelas.primeira.toFixed(2)),
      ultimaParcela: Number(dados.parcelas.ultima.toFixed(2)),
      rendaNecessaria: Number(dados.rendaNecessaria.toFixed(2)),
      limitado: !!dados.limitado,
      sistema: dados.sistema
    };
  }

  /**
   * Gera um objeto zerado para estados iniciais.
   * @returns {ResultadoCalculo} Resultado vazio.
   */
  public gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorImovel: 0, valorFinanciado: 0, valorEntrada: 0, outrasDespesas: 0,
      jurosEfetivo: 0, primeiraParcela: 0, ultimaParcela: 0, rendaNecessaria: 0,
      limitado: false, sistema: 'price'
    };
  }
}