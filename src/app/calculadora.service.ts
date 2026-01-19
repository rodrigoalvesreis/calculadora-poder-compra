import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

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
  private faixas = environment.faixas;
  private prazoAnos = environment.prazoAnos;

  //Percentual máximo que a caixa financia sobre o valor do imóvel
  private readonly PERCENTUAL_FINANCIADO = 0.8; 
  // Estimativa de custos adicionais (ITBI e Escritura)
  private readonly PERCENTUAL_DESPESAS = 0.05;

  /**
   * Converte taxa Anual para Mensal utilizando juros compostos.
   * Fórmula: (1 + i_a) = (1 + i_m)^12
   */
  private taxaAaParaAm = (ia: number): number => Math.pow(1 + ia, 1 / 12) - 1;

  
  /**
   * Define o sistema de amortização. 
   * Estratégia: Taxas maiores (Balcão) utilizam SAC para amortização mais rápida do principal.
   */
  private definirSistema(taxaEfetiva: number): 'sac' | 'price' {
    return taxaEfetiva >= TAXA_BALCAO ? 'sac' : 'price';
  }

  /**
   * Cálculo das parcelas baseado no sistema escolhido.
   * @param pv Valor Presente (Valor Financiado)
   * @param taxaMensal Taxa de juros mensal (decimal)
   * @param n Prazo em meses
   * @param sistema 'sac' ou 'price'
   */
  private calcularParcelas(pv: number, taxaMensal: number, n: number, sistema: 'sac' | 'price') {
    if (n <= 0 || pv <= 0) return { primeira: 0, ultima: 0 };

    if (sistema === 'price') {
      // Tabela Price: Parcelas iguais. 
      // PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
      const valor = taxaMensal === 0 ? pv / n : pv * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -n)));
      return { primeira: valor, ultima: valor };
    }

    // SAC: Amortização mensal constante (A = PV / n)
    const amortizacao = pv / n;
    // Parcela = Amortização + Juros sobre o Saldo Devedor
    return {
      primeira: amortizacao + (pv * taxaMensal),
      ultima: amortizacao + (amortizacao * taxaMensal)
    };
  }

  /**
   * Determina em qual faixa de juros o perfil se enquadra.
   */
  private getFaixaIndex(valor: number, tipo: 'imovel' | 'renda'): number {
    const campo = tipo === 'imovel' ? 'limiteImovel' : 'limiteRenda';
    const idx = this.faixas.findIndex(f => valor <= f[campo]);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  /**
   * Simulação principal: Avalia viabilidade de um imóvel vs renda informada.
   */
  public calcularFinanciamentoImovelRenda(
    valorImovel: number,
    renda: number,
    prazoAnosManual?: number
  ): ResultadoCalculo {
    const prazo = prazoAnosManual || this.prazoAnos;
    const meses = Math.trunc(prazo * 12);

    if (valorImovel <= 0 || renda <= 0) return this.gerarResultadoVazio();

    // Seleciona a faixa de juros baseada no maior limitador (imóvel ou renda)
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

    // Ajuste de "Capacidade de Pagamento":
    // Se a 1ª parcela > 30% da renda, reduzimos o financiamento para o máximo suportado pela renda.
    if (parcelas.primeira > parcelaMaximaRenda) {
      if (sistema === 'price') {
        valorFinanciado = taxaMensal === 0
          ? parcelaMaximaRenda * meses
          : parcelaMaximaRenda * (1 - Math.pow(1 + taxaMensal, -meses)) / taxaMensal;
      } else {
        // PV = P1 / ( (1/n) + i )
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
   * Ponto de entrada versátil para diferentes fluxos de simulação.
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
   * Fluxo quando o usuário sabe o preço do imóvel. 
   * Itera para encontrar a renda mínima necessária que enquadre na faixa de juros correta.
   */
  private processarFluxoImovel(valorImovel: number, meses: number): ResultadoCalculo {
    const valorFinanciadoBase = valorImovel * this.PERCENTUAL_FINANCIADO;
    const idxBase = this.getFaixaIndex(valorImovel, 'imovel');

    let idxAtual = idxBase;
    let taxaEfetiva = 0, taxaMensal = 0, sistema: 'sac' | 'price' = 'sac';
    let parcelas = { primeira: 0, ultima: 0 };

    // Loop de convergência: garante que a taxa de juros condiz com a renda necessária calculada
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
   * Fluxo "Quanto eu posso comprar?": Baseia o imóvel no máximo de parcela que a renda suporta.
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

    // Respeita o limite de valor de imóvel da faixa de renda (ex: Faixas de Subsídio)
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

  private processarFluxoPrestacao(parcela: number, meses: number): ResultadoCalculo {
    const renda = parcela / PERCENTUAL_COMPROMETIMENTO;
    return this.processarFluxoRenda(renda, meses);
  }

  /**
   * Garante a precisão decimal financeira
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