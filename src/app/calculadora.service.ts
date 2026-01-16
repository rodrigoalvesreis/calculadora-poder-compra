
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface ResultadoCalculo {
  valorImovel: number;
  valorFinanciado: number;
  valorEntrada: number;
  outrasDespesas: number;
  jurosNominal: number;
  jurosEfetivo: number;
  primeiraParcela: number;
  ultimaParcela: number;
  rendaNecessaria: number | null;
  limitado: boolean;
}

const TAXA_BALCAO = 0.1092;
const PERCENTUAL_COMPROMETIMENTO = 0.3; // 30% da renda

@Injectable({ providedIn: 'root' })
export class CalculadoraService {
  private faixas = environment.faixas; 
  
  private readonly PERCENTUAL_FINANCIADO = 0.8;
  private readonly PERCENTUAL_ENTRADA = 0.2;
  private readonly PERCENTUAL_DESPESAS = 0.05;

  // --- Helpers de Cálculo ---

  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;
  private jurosMensalParaAnual = (im: number): number => Math.pow(1 + im, 12) - 1;

  /**
   * Centraliza a lógica de cálculo de parcelas
   */
  private calcularParcelas(pv: number, taxaMensal: number, n: number, sistema: 'sac' | 'price') {
    if (n <= 0 || pv <= 0) return { primeira: 0, ultima: 0 };

    if (sistema === 'price') {
      const valor = taxaMensal === 0 ? pv / n : pv * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -n)));
      return { primeira: valor, ultima: valor };
    }

    const amortizacao = pv / n;
    return {
      primeira: amortizacao + pv * taxaMensal,
      ultima: amortizacao + amortizacao * taxaMensal
    };
  }

  // --- Helpers de Faixas ---

  private getFaixaIndex(valor: number, tipo: 'imovel' | 'renda'): number {
    const campo = tipo === 'imovel' ? 'limiteImovel' : 'limiteRenda';
    const idx = this.faixas.findIndex(f => valor <= f[campo]);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  // --- Fluxo Principal ---

  calcularFinanciamento(
    valorInput: number,
    prazoAnos: number,
    sistema: 'sac' | 'price',
    tipo: 'imovel' | 'renda'
  ): ResultadoCalculo {
    
    // Validação básica
    if (!valorInput || valorInput <= 0 || !prazoAnos || prazoAnos <= 0) {
      return this.gerarResultadoVazio();
    }

    const prazoMeses = Math.trunc(prazoAnos * 12);
    
    // Variáveis de controle inicializadas com valores do fluxo
    return tipo === 'imovel' 
      ? this.processarFluxoImovel(valorInput, prazoMeses, sistema)
      : this.processarFluxoRenda(valorInput, prazoMeses, sistema);
  }

  private processarFluxoImovel(valorImovel: number, n: number, sistema: 'sac' | 'price'): ResultadoCalculo {
    const valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    const idxBase = this.getFaixaIndex(valorImovel, 'imovel');
    
    let idxAtual = idxBase;
    let taxaNominal = 0;
    let taxaMensal = 0;
    let parcelas = { primeira: 0, ultima: 0 };

    // Loop de convergência para encontrar a faixa que aceita o Imóvel + Renda Necessária
    for (let i = 0; i < 8; i++) {
      taxaNominal = this.faixas[idxAtual]?.taxaNominal ?? TAXA_BALCAO;
      taxaMensal = this.taxaAaParaAm(taxaNominal);
      parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, n, sistema);
      
      const rendaNecessaria = parcelas.primeira / PERCENTUAL_COMPROMETIMENTO;
      const idxRenda = this.getFaixaIndex(rendaNecessaria, 'renda');
      const novoIdx = Math.max(idxBase, idxRenda);

      if (novoIdx === idxAtual) break;
      idxAtual = novoIdx;
    }

    return this.formatarResultado({
      valorImovel,
      valorFinanciado,
      taxaNominal,
      taxaMensal,
      parcelas,
      rendaNecessaria: parcelas.primeira / PERCENTUAL_COMPROMETIMENTO
    });
  }

  private processarFluxoRenda(renda: number, n: number, sistema: 'sac' | 'price'): ResultadoCalculo {
    const idxRenda = this.getFaixaIndex(renda, 'renda');
    const taxaNominal = this.faixas[idxRenda]?.taxaNominal ?? TAXA_BALCAO;
    const taxaMensal = this.taxaAaParaAm(taxaNominal);
    const parcelaMax = renda * PERCENTUAL_COMPROMETIMENTO;

    // Cálculo do Valor Presente baseado na parcela máxima
    let valorFinanciado = 0;
    if (sistema === 'price') {
      valorFinanciado = taxaMensal === 0 ? parcelaMax * n : parcelaMax * (1 - Math.pow(1 + taxaMensal, -n)) / taxaMensal;
    } else {
      valorFinanciado = parcelaMax / ((1 / n) + taxaMensal);
    }

    let valorImovel = valorFinanciado / this.PERCENTUAL_FINANCIADO;
    let limitado = false;
    const limiteFaixa = this.faixas[idxRenda]?.limiteImovel ?? Infinity;

    // Aplicação de trava se o valor do imóvel exceder o teto da faixa de renda
    if (valorImovel > limiteFaixa) {
      limitado = true;
      valorImovel = limiteFaixa;
      valorFinanciado = valorImovel * this.PERCENTUAL_FINANCIADO;
    }

    const parcelas = this.calcularParcelas(valorFinanciado, taxaMensal, n, sistema);

    return this.formatarResultado({
      valorImovel,
      valorFinanciado,
      taxaNominal,
      taxaMensal,
      parcelas,
      rendaNecessaria: null,
      limitado,
      limiteAplicado: limitado ? limiteFaixa : undefined
    });
  }

  // --- Formatação e Limpeza ---

  private formatarResultado(dados: any): ResultadoCalculo {
    return {
      valorImovel: Number(dados.valorImovel.toFixed(2)),
      valorFinanciado: Number(dados.valorFinanciado.toFixed(2)),
      valorEntrada: Number((dados.valorImovel * this.PERCENTUAL_ENTRADA).toFixed(2)),
      outrasDespesas: Number((dados.valorImovel * this.PERCENTUAL_DESPESAS).toFixed(2)),
      jurosNominal: Number(dados.taxaNominal.toFixed(4)),
      jurosEfetivo: Number(this.jurosMensalParaAnual(dados.taxaMensal).toFixed(4)),
      primeiraParcela: Number(dados.parcelas.primeira.toFixed(2)),
      ultimaParcela: Number(dados.parcelas.ultima.toFixed(2)),
      rendaNecessaria: dados.rendaNecessaria ? Number(dados.rendaNecessaria.toFixed(2)) : null,
      limitado: dados.limitado || false,
    };
  }

  gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorImovel: 0, valorFinanciado: 0, valorEntrada: 0, outrasDespesas: 0,
      jurosNominal: 0, jurosEfetivo: 0, primeiraParcela: 0, ultimaParcela: 0,
      rendaNecessaria: null, limitado: false
    };
  }
}

