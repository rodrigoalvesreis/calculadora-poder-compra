
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export class ResultadoCalculo {
  constructor(
    public valorImovel: number = 0,          // preço total do imóvel
    public valorFinanciado: number = 0,      // 80% do imóvel
    public valorEntrada: number = 0,         // 20% do imóvel
    public outrasDespesas: number = 0,       // 5% do valor do imóvel
    public jurosNominal: number = 0,         // taxa nominal a.a.
    public jurosEfetivo: number = 0,         // taxa efetiva a.a.
    public primeiraParcela: number = 0,      // primeira parcela
    public ultimaParcela: number = 0,        // última parcela
    public rendaNecessaria: number | null = null, // renda necessária (quando tipo = 'imovel')

    // Indicadores (usados no fluxo 'renda')
    public limitado: boolean = false,
    public motivoLimite?: 'limiteImovelFaixa',
    public limiteAplicado?: number
  ) {}
}

const TAXA_BALCAO = 0.1092;

@Injectable({ providedIn: 'root' })
export class FinanciamentoService {
  private faixas = environment.faixas;
  private percentualFinanciado = 0.8;
  private percentualEntrada = 0.2;
  private percentualoutrasDespesas = 0.05; // 5% do valor do imóvel

  // ===== Helpers =====
  private taxaAaParaAm = (ia: number) => Math.pow(1 + ia, 1 / 12) - 1;

  private calcularParcelaPrice(pv: number, i: number, n: number) {
    if (n <= 0 || pv <= 0) return 0;
    if (i === 0) return pv / n;
    const fator = Math.pow(1 + i, -n);
    return pv * (i / (1 - fator));
  }

  private calcularPrimeiraEUlltimSAC(pv: number, i: number, n: number) {
    if (n <= 0 || pv <= 0) return { primeira: 0, ultima: 0 };
    const amortizacao = pv / n;
    const primeira = amortizacao + pv * i;
    const ultima = amortizacao + amortizacao * i;
    return { primeira, ultima };
  }

  private getFaixaIndexPorImovel(valorImovel: number): number {
    const idx = this.faixas.findIndex(f => valorImovel <= f.limiteImovel);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  private getFaixaIndexPorRenda(renda: number): number {
    const idx = this.faixas.findIndex(f => renda <= f.limiteRenda);
    return idx >= 0 ? idx : this.faixas.length - 1;
  }

  private getTaxaByIndex(idx: number): number {
    return this.faixas[idx]?.taxaNominal ?? TAXA_BALCAO;
  }

  // ===== API =====
  calcularFinanciamento(
    valorImovelOrRenda: number,
    prazoAnos: number,
    sistema: 'sac' | 'price',
    tipo: 'imovel' | 'renda'
  ): ResultadoCalculo {

    if (!isFinite(valorImovelOrRenda) || valorImovelOrRenda <= 0) {
      return new ResultadoCalculo();
    }
    if (!Number.isFinite(prazoAnos) || prazoAnos <= 0) {
      return new ResultadoCalculo();
    }

    const prazoMeses = Math.trunc(prazoAnos * 12);

    // Saídas
    let valorImovel = 0;
    let valorFinanciado = 0;
    let valorEntrada = 0;
    let outrasDespesas = 0;
    let primeiraParcela = 0;
    let ultimaParcela = 0;
    let rendaNecessaria: number | null = null;
    let jurosNominal = 0;
    let jurosEfetivo = 0;

    // Indicadores (apenas para 'renda')
    let limitado = false;
    let motivoLimite: ResultadoCalculo['motivoLimite'] = undefined;
    let limiteAplicado: number | undefined = undefined;

    if (tipo === 'imovel') {
      // ---- Fluxo por IMÓVEL ----
      valorImovel = valorImovelOrRenda;
      valorFinanciado = valorImovel * this.percentualFinanciado;
      valorEntrada = valorImovel * this.percentualEntrada;
      outrasDespesas = valorImovel * this.percentualoutrasDespesas;

      // 1) Índice mínimo que cobre o IMÓVEL
      const idxImovel = this.getFaixaIndexPorImovel(valorImovel);

      // 2) Itera até que a faixa satisfaça simultaneamente IMÓVEL e RENDA
      let idxAtual = idxImovel;
      const maxIter = 8;

      for (let iter = 0; iter < maxIter; iter++) {
        const taxaNominal = this.getTaxaByIndex(idxAtual);
        const taxaMensal = this.taxaAaParaAm(taxaNominal);

        if (sistema === 'price') {
          primeiraParcela = this.calcularParcelaPrice(valorFinanciado, taxaMensal, prazoMeses);
          ultimaParcela = primeiraParcela;
        } else {
          const { primeira, ultima } = this.calcularPrimeiraEUlltimSAC(valorFinanciado, taxaMensal, prazoMeses);
          primeiraParcela = primeira;
          ultimaParcela = ultima;
        }

        rendaNecessaria = primeiraParcela > 0 ? (primeiraParcela / 0.3) : 0;

        // Índice que cobre a RENDA sugerida
        const idxRenda = this.getFaixaIndexPorRenda(rendaNecessaria || 0);

        // Nova faixa precisa cobrir IMÓVEL e RENDA ao mesmo tempo
        const idxNovo = Math.max(idxImovel, idxRenda);

        if (idxNovo === idxAtual) {
          // Consistiu: esta é a menor faixa que atende IMÓVEL e RENDA
          jurosNominal = taxaNominal;
          jurosEfetivo = Math.pow(1 + taxaMensal, 12) - 1;
          break;
        }

        idxAtual = idxNovo;

        // Última iteração: garante saída consistente mesmo sem convergir
        if (iter === maxIter - 1) {
          const taxaNominalFinal = this.getTaxaByIndex(idxAtual);
          const iMensal = this.taxaAaParaAm(taxaNominalFinal);
          jurosNominal = taxaNominalFinal;
          jurosEfetivo = Math.pow(1 + iMensal, 12) - 1;

          if (sistema === 'price') {
            primeiraParcela = this.calcularParcelaPrice(valorFinanciado, iMensal, prazoMeses);
            ultimaParcela = primeiraParcela;
          } else {
            const { primeira, ultima } = this.calcularPrimeiraEUlltimSAC(valorFinanciado, iMensal, prazoMeses);
            primeiraParcela = primeira;
            ultimaParcela = ultima;
          }
          rendaNecessaria = primeiraParcela > 0 ? (primeiraParcela / 0.3) : 0;
        }
      }

    } else {
      // ---- Fluxo por RENDA ----
      const renda = valorImovelOrRenda;

      // Taxa definida pela faixa da RENDA
      const idxRenda = this.getFaixaIndexPorRenda(renda);
      jurosNominal = this.getTaxaByIndex(idxRenda);
      const taxaMensal = this.taxaAaParaAm(jurosNominal);
      jurosEfetivo = Math.pow(1 + taxaMensal, 12) - 1;

      const parcelaMaxima = renda * 0.3;

      if (sistema === 'price') {
        if (taxaMensal === 0) {
          valorFinanciado = parcelaMaxima * prazoMeses;
        } else {
          valorFinanciado = parcelaMaxima * (1 - Math.pow(1 + taxaMensal, -prazoMeses)) / taxaMensal;
        }
        primeiraParcela = parcelaMaxima;
        ultimaParcela = parcelaMaxima;
      } else {
        const divisor = (1 / prazoMeses) + taxaMensal;
        valorFinanciado = divisor > 0 ? parcelaMaxima / divisor : 0;

        const amortizacao = valorFinanciado / prazoMeses;
        primeiraParcela = amortizacao + (valorFinanciado * taxaMensal);
        ultimaParcela = amortizacao + (amortizacao * taxaMensal);
      }

      // valor total do imóvel a partir do financiamento (80%)
      valorImovel = valorFinanciado / this.percentualFinanciado;

      // Aplica teto pelo limite da faixa de RENDA
      const limiteImovelFaixa = this.faixas[idxRenda]?.limiteImovel ?? Number.POSITIVE_INFINITY;
      if (valorImovel > limiteImovelFaixa) {
        // Sinaliza que o imóvel calculado foi limitado ao teto dessa faixa
        limitado = true;
        motivoLimite = 'limiteImovelFaixa';
        limiteAplicado = limiteImovelFaixa;

        valorImovel = limiteImovelFaixa;
        valorFinanciado = valorImovel * this.percentualFinanciado;

        // Recalcula parcelas com o PV limitado
        if (sistema === 'price') {
          primeiraParcela = this.calcularParcelaPrice(valorFinanciado, taxaMensal, prazoMeses);
          ultimaParcela = primeiraParcela;
        } else {
          const { primeira, ultima } = this.calcularPrimeiraEUlltimSAC(valorFinanciado, taxaMensal, prazoMeses);
          primeiraParcela = primeira;
          ultimaParcela = ultima;
        }
      }

      valorEntrada = valorImovel * this.percentualEntrada;
      outrasDespesas = valorImovel * this.percentualoutrasDespesas;

      // rendaNecessaria não se aplica neste fluxo
      rendaNecessaria = null;
    }

    return new ResultadoCalculo(
      Number((valorImovel || 0).toFixed(2)),
      Number((valorFinanciado || 0).toFixed(2)),
      Number((valorEntrada || 0).toFixed(2)),
      Number((outrasDespesas || 0).toFixed(2)),
      Number((jurosNominal || 0).toFixed(4)),
      Number((jurosEfetivo || 0).toFixed(4)),
      Number((primeiraParcela || 0).toFixed(2)),
      Number((ultimaParcela || 0).toFixed(2)),
      (rendaNecessaria !== null) ? Number((rendaNecessaria || 0).toFixed(2)) : null,
      // indicadores de limite (somente no fluxo 'renda')
      limitado,
      motivoLimite,
      limiteAplicado
    );
  }
}

