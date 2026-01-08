
// src/app/calculator.service.ts
import { Injectable } from '@angular/core';

export interface CalculoResultado {
  parcelaMaxima: number;
  financiamentoPorRenda: number;
  financiamentoPorEntrada: number;
  financiamentoFinal: number;
  valorImovel: number;
  entradaNecessariaMinima: number;
  entradaSuficiente: boolean;
  taxasEstimadas: number;
  observacoes: string[];
}

export interface CalculoOpts {
  taxaAnual?: number;        // Ex.: 0.115 = 11,5% a.a.
  prazoAnos?: number;        // Ex.: 35 anos
  comprometimento?: number;  // Ex.: 0.30 = 30% da renda
  percEntradaMin?: number;   // Ex.: 0.20 = 20% do valor do imóvel
  percTaxas?: number;        // Ex.: 0.05 = 5% ITBI + taxas
}

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  calcularPoderDeCompra(rendaMensalBRL: number, entradaBRL: number, opts: CalculoOpts = {}): CalculoResultado {
    const {
      taxaAnual = 0.115,       // 11,5% a.a. (ajuste conforme cenário)
      prazoAnos = 35,          // 35 anos
      comprometimento = 0.30,  // 30% da renda
      percEntradaMin = 0.20,   // 20% de entrada
      percTaxas = 0.05         // 5% para ITBI e taxas
    } = opts;

    const observacoes: string[] = [];

    // Validações
    if (![rendaMensalBRL, entradaBRL].every(x => Number.isFinite(x) && x >= 0)) {
      throw new Error('Informe valores numéricos válidos para renda e entrada (≥ 0).');
    }
    if ([taxaAnual, prazoAnos, comprometimento, percEntradaMin, percTaxas].some(x => !Number.isFinite(x) || x < 0)) {
      throw new Error('Parâmetros inválidos: use números ≥ 0.');
    }
    if (comprometimento <= 0 || comprometimento > 1) {
      throw new Error('Comprometimento deve estar entre 0 e 1 (ex.: 0.30).');
    }
    if (percEntradaMin <= 0 || percEntradaMin >= 1) {
      throw new Error('Entrada mínima deve estar entre 0 e 1 (ex.: 0.20).');
    }

    // 1) Limite de parcela pela renda
    const parcelaMaxima = rendaMensalBRL * comprometimento;

    // 2) Conversão de taxa anual para mensal (efetiva)
    const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
    const nMeses = Math.round(prazoAnos * 12);

    // 3) Valor máximo financiável pela renda (tabela Price)
    let financiamentoPorRenda = 0;
    if (taxaMensal > 0) {
      financiamentoPorRenda = parcelaMaxima * (1 - Math.pow(1 + taxaMensal, -nMeses)) / taxaMensal;
    } else {
      financiamentoPorRenda = parcelaMaxima * nMeses;
    }

    // 4) Limitação por entrada mínima (20% do valor do imóvel)
    const valorImovelMinimoPorEntrada = entradaBRL / percEntradaMin;
    const financiamentoPorEntrada = Math.max(0, valorImovelMinimoPorEntrada - entradaBRL);

    // 5) Financiamento final
    const financiamentoFinal = Math.min(financiamentoPorRenda, financiamentoPorEntrada);

    // 6) Valor do imóvel (sem taxas)
    const valorImovel = entradaBRL + financiamentoFinal;

    // 7) Entrada mínima necessária para aproveitar todo crédito pela renda
    const entradaNecessariaMinima = percEntradaMin * (entradaBRL + financiamentoPorRenda);
    const entradaSuficiente = entradaBRL >= entradaNecessariaMinima - 1e-6;

    // 8) ITBI e taxas
    const taxasEstimadas = percTaxas * valorImovel;

    // Observações
    observacoes.push(
      entradaSuficiente
        ? 'Sua entrada é suficiente para aproveitar o limite de financiamento pela renda.'
        : 'Sua entrada atual é inferior à entrada mínima necessária para usar todo o crédito que sua renda permite. Considere aumentar a entrada ou reduzir o financiamento.'
    );
    observacoes.push('ITBI e taxas estimadas em 5% do valor do imóvel. Alguns bancos permitem incluir no financiamento.');
    observacoes.push(`Parcela máxima considerada: ${(comprometimento * 100).toFixed(0)}% da renda.`);
    observacoes.push(`Taxa anual usada: ${(taxaAnual * 100).toFixed(2)}% | Prazo: ${prazoAnos} anos.`);

    return {
      parcelaMaxima,
      financiamentoPorRenda,
      financiamentoPorEntrada,
      financiamentoFinal,
      valorImovel,
      entradaNecessariaMinima,
      entradaSuficiente,
      taxasEstimadas,
      observacoes
    };
  }

  /** Converte string BRL ("R$ 1.234,56") para número 1234.56 */
  parseBRL(input: string | number): number {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') throw new Error('Entrada deve ser string ou número.');
    const sanitized = input.replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = Number(sanitized);
    if (!Number.isFinite(num)) throw new Error(`Não foi possível converter "${input}".`);
    return num;
  }
}
