import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Interface que define a estrutura do retorno dos cálculos.
 */
export interface ResultadoCalculo {
  valorImovel: number;
  valorFinanciado: number;
  valorEntrada: number;
  outrasDespesas: number;
  jurosEfetivo: number;
  primeiraParcela: number;
  ultimaParcela: number;
  rendaNecessaria: number;
  limitado: boolean;
  sistema: 'sac' | 'price';
}

const TAXA_BALCAO_LIMITE = 0.1092; // Ponto de corte para transição SAC/PRICE
const PERCENTUAL_COMPROMETIMENTO = 0.3;

@Injectable({ providedIn: 'root' })
export class CalculadoraService {
  private faixas = environment.poderCompraConfig.faixas;
  private prazoAnos = environment.poderCompraConfig.prazoAnos;

  private readonly PERCENTUAL_FINANCIADO = 0.8;
  private readonly PERCENTUAL_DESPESAS = 0.05;

  /**
   * Converte taxa Anual para Mensal (Juros Compostos).
   */
  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;

  /**
   * Define o sistema de amortização.
   */
  private definirSistema(taxaEfetiva: number): 'sac' | 'price' {
    return taxaEfetiva >= TAXA_BALCAO_LIMITE ? 'sac' : 'price';
  }

  /**
   * Cálculo das parcelas SAC ou Price.
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
   * Busca o índice da faixa no environment.
   */
  private getFaixaIndex(valor: number, tipo: 'imovel' | 'renda'): number {
    const campo = tipo === 'imovel' ? 'limiteImovel' : 'limiteRenda';
    const idx = this.faixas.findIndex(f => valor <= f[campo]);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  /**
   * FLUXO 1: IMÓVEL + RENDA (Respeita o valor do imóvel e rebaixa o financiamento se necessário)
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

    const taxaEfetiva = this.faixas[idxFinal]?.taxaEfetiva ?? 0.1149;
    const taxaMensal = this.taxaAaParaAm(taxaEfetiva);
    const sistema = this.definirSistema(taxaEfetiva);

    let valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    let parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);
    const parcelaMaximaRenda = renda * PERCENTUAL_COMPROMETIMENTO;

    let limitado = false;
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
   * Ponto de entrada para fluxos baseados em apenas um valor.
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
   * FLUXO 2: RENDA / PRESTAÇÃO (Poder de Compra - Sobe de faixa se necessário)
   */
  private processarFluxoRenda(renda: number, meses: number): ResultadoCalculo {
    let idxAtual = this.getFaixaIndex(renda, 'renda');
    
    // Variáveis inicializadas para evitar erro ts(2454)
    let taxaEfetiva = 0;
    let taxaMensal = 0;
    let sistema: 'sac' | 'price' = 'price';
    let valorFinanciado = 0;
    let valorImovel = 0;
    
    const parcelaMax = renda * PERCENTUAL_COMPROMETIMENTO;

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

      // Se o imóvel calculado cabe na faixa atual de juros, paramos.
      // Senão, o loop continua e sobe para uma faixa com limite de imóvel maior.
      if (valorImovel <= limiteFaixaImovel || idxAtual === this.faixas.length - 1) {
        break; 
      }
    }

    const parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, meses, sistema);

    return this.formatarResultado({
      valorImovel, valorFinanciado, taxaEfetiva, taxaMensal, parcelas, sistema,
      rendaNecessaria: renda, limitado: false
    });
  }

  private processarFluxoPrestacao(parcela: number, meses: number): ResultadoCalculo {
    const renda = parcela / PERCENTUAL_COMPROMETIMENTO;
    return this.processarFluxoRenda(renda, meses);
  }

  private processarFluxoImovel(valorImovel: number, meses: number): ResultadoCalculo {
    const valorFinanciadoBase = valorImovel * this.PERCENTUAL_FINANCIADO;
    const idxBase = this.getFaixaIndex(valorImovel, 'imovel');

    let idxAtual = idxBase;
    let taxaEfetiva = 0, taxaMensal = 0, sistema: 'sac' | 'price' = 'sac';
    let parcelas = { primeira: 0, ultima: 0 };

    for (let i = 0; i < this.faixas.length; i++) {
      taxaEfetiva = this.faixas[idxAtual]?.taxaEfetiva ?? 0.1149;
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
      valorImovel, valorFinanciado: valorFinanciadoBase, taxaEfetiva, taxaMensal,
      parcelas, sistema, rendaNecessaria: parcelas.primeira / PERCENTUAL_COMPROMETIMENTO
    });
  }

  private formatarResultado(dados: any): ResultadoCalculo {
    return {
      valorImovel: Number(dados.valorImovel.toFixed(2)),
      valorFinanciado: Number(dados.valorFinanciado.toFixed(2)),
      valorEntrada: Number((dados.valorImovel - dados.valorFinanciado).toFixed(2)),
      outrasDespesas: Number((dados.valorImovel * this.PERCENTUAL_DESPESAS).toFixed(2)),
      jurosEfetivo: Number(dados.taxaEfetiva.toFixed(6)),
      primeiraParcela: Number(dados.parcelas.primeira.toFixed(2)),
      ultimaParcela: Number(dados.parcelas.ultima.toFixed(2)),
      rendaNecessaria: Number(dados.rendaNecessaria.toFixed(2)),
      limitado: !!dados.limitado,
      sistema: dados.sistema
    };
  }

  public gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorImovel: 0, valorFinanciado: 0, valorEntrada: 0, outrasDespesas: 0,
      jurosEfetivo: 0, primeiraParcela: 0, ultimaParcela: 0, rendaNecessaria: 0,
      limitado: false, sistema: 'price'
    };
  }
}