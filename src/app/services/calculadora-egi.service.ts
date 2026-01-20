import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Interface que define a estrutura do retorno dos cálculos do EGI.
 * Centraliza as informações necessárias para exibição em UI.
 */
export interface ResultadoCalculo {
  valorMaximoFinanciavel: number;
  prestacaoMaximaPermitida: number;
  prestacaoEstimada: number;
  taxaAplicadaAnual: number;
  prazoAplicadoAnos: number;
  erro?: string;
}

@Injectable({ providedIn: 'root' })
export class EgiCalculatorService {
  private config = environment.egiConfig;

  /**
   * Converte taxa Anual para Mensal utilizando juros compostos.
   * @param ia Taxa de juros Anual em formato decimal (ex: 0.1746 para 17,46%).
   * @returns Taxa de juros mensal equivalente em decimal.
   */
  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;

  /**
   * Garante a precisão decimal financeira (arredondamento para 2 casas).
   * @param valor Valor numérico bruto.
   * @returns Valor formatado para representação monetária.
   */
  private formatarMoeda(valor: number): number {
    return Number(valor.toFixed(2));
  }

  /**
   * Cálculo de Prestação (PGTO) utilizando o Sistema Price (parcelas fixas).
   * @param vp Valor Presente / Montante do empréstimo.
   * @param i Taxa de juros mensal em decimal.
   * @param n Prazo total em meses.
   * @returns Valor da parcela mensal constante.
   */
  private calcularPGTO(vp: number, i: number, n: number): number {
    if (vp <= 0 || n <= 0) return 0;
    if (i === 0) return vp / n;
    return vp * (i / (1 - Math.pow(1 + i, -n)));
  }

  /**
   * Cálculo de Valor Presente (VP) a partir de uma prestação máxima permitida.
   * @param pgto Valor da parcela alvo (limite de renda).
   * @param i Taxa de juros mensal em decimal.
   * @param n Prazo total em meses.
   * @returns Montante máximo financiado que a parcela suporta.
   */
  private calcularVP(pgto: number, i: number, n: number): number {
    if (i === 0) return pgto * n;
    return pgto * ((1 - Math.pow(1 + i, -n)) / i);
  }

  /**
   * Executa a simulação principal do Equity (EGI).
   * @param valorImovel Valor de mercado/avaliação do imóvel.
   * @param saldoDevedor Valor que o cliente ainda deve ao banco (se houver).
   * @param renda Renda mensal bruta para cálculo de margem.
   * @param liquidacaoSimultanea Define se o saldo devedor será quitado com o novo crédito.
   * @returns Objeto contendo os limites calculados ou mensagem de erro impeditiva.
   */
  public calcular(valorImovel: number, saldoDevedor: number, renda: number, liquidacaoSimultanea: boolean): ResultadoCalculo {
    const { limites, cenarios } = this.config;

    if (valorImovel <= 0 || renda <= 0) return this.gerarResultadoVazio();

    let taxaAnual = 0;
    let prazoAnos = 0;

    // 1. Definição da Capacidade de Pagamento (Margem Consignável)
    const prestacaoMaxima = renda * limites.percentualMaximoRenda;

    // 2. Seleção de Cenário e Taxas
    if (saldoDevedor > 0 && liquidacaoSimultanea) {
      prazoAnos = cenarios.liquidacao.prazoAnos;
      if (this.estaNaFaixaBaixa(valorImovel)) {
        return this.retornarErro('Liquidação simultânea não permitida para imóveis até 100k.');
      }
      taxaAnual = cenarios.liquidacao.taxaAcimaCorte;
    } else {
      const cenario = saldoDevedor <= 0 ? cenarios.quitado : cenarios.financiado;
      prazoAnos = cenario.prazoAnos;

      if (valorImovel < limites.valorMinimoImovel) {
        return this.retornarErro('Valor do imóvel abaixo do mínimo permitido.');
      }
      taxaAnual = this.estaNaFaixaBaixa(valorImovel) ? cenario.taxaAteCorte : cenario.taxaAcimaCorte;
    }

    // 3. Cálculos Financeiros
    const meses = Math.trunc(prazoAnos * 12);
    const taxaMensal = this.taxaAaParaAm(taxaAnual);

    // Teto pelo LTV (Loan-to-Value) e Equity
    let tetoImovel = valorImovel * limites.percentualMaximoLtv;
    if (saldoDevedor > 0 && !liquidacaoSimultanea) {
      // Se não liquidar, o teto é limitado pelo que já pertence ao cliente (equity real)
      tetoImovel = Math.min(tetoImovel, valorImovel - saldoDevedor);
    }

    // Teto pela Renda (Valor Presente suportado pela parcela máxima)
    const tetoRenda = this.calcularVP(prestacaoMaxima, taxaMensal, meses);

    // Valor Final (O menor entre o teto do imóvel e o teto da renda)
    const valorPotencial = Math.min(tetoImovel, tetoRenda);

    // 4. Validação de Ticket Mínimo (Mínimo de R$ 50.000,00)
    if (valorPotencial < limites.valorMinimoCredito) {
      return this.retornarErro(`Crédito insuficiente: R$ ${this.formatarMoeda(valorPotencial).toLocaleString('pt-BR')} é inferior ao mínimo de R$ 50.000,00.`);
    }

    const prestacaoEstimada = this.calcularPGTO(valorPotencial, taxaMensal, meses);

    return {
      valorMaximoFinanciavel: this.formatarMoeda(valorPotencial),
      prestacaoMaximaPermitida: this.formatarMoeda(prestacaoMaxima),
      prestacaoEstimada: this.formatarMoeda(prestacaoEstimada),
      taxaAplicadaAnual: taxaAnual,
      prazoAplicadoAnos: prazoAnos
    };
  }

  /**
   * Verifica se o imóvel se enquadra na primeira faixa de juros (abaixo do ponto de corte).
   * @param v Valor do imóvel.
   */
  private estaNaFaixaBaixa(v: number): boolean {
    return v >= this.config.limites.valorMinimoImovel && v <= this.config.limites.pontoCorteTaxa;
  }

  /**
   * Inicializa um objeto de resultado zerado.
   */
  private gerarResultadoVazio(): ResultadoCalculo {
    return {
      valorMaximoFinanciavel: 0,
      prestacaoMaximaPermitida: 0,
      prestacaoEstimada: 0,
      taxaAplicadaAnual: 0,
      prazoAplicadoAnos: 0
    };
  }

  /**
   * Prepara o retorno contendo uma mensagem de erro para a interface.
   * @param msg Descrição do erro amigável ao usuário.
   */
  private retornarErro(msg: string): ResultadoCalculo {
    const output = this.gerarResultadoVazio();
    output.erro = msg;
    return output;
  }
}