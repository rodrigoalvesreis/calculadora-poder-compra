import { Injectable } from '@angular/core';

export interface Parcela {
  mes: number;
  valorLiberado?: number;           // valor liberado no mês
  valorLiberadoAcumulado?: number;  // acumulado até o mês
  valorParcela: number;             // parcela considerando juros
  valorAmortizacao: number;
}

export interface TimelineEtapa {
  etapa: string;
  mes: number;
  data: Date;
  fase: 'Obras' | 'Amortizacao';
}

@Injectable({
  providedIn: 'root'
})
export class FinanciamentoObrasService {

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

    //financia até 80% do valor da obra
    valorObra = valorObra * 0.8;
    valorTerreno = valorTerreno * 0.8;
    
    // exemplo: 0.0723 = 0,00584 ao mês
    const taxaJurosMensal = 0.00584;

    // --- Fase de Obras ---
    const faseObras: Parcela[] = [];
    let acumuladoAnterior = 0;
    for (let i = 1; i <= prazoObra; i++) {
      const percentualAcumulado = i / prazoObra;
      let valorAcumulado = valorObra * percentualAcumulado;
      let valorLiberadoMes = valorAcumulado - acumuladoAnterior;
      
      //valor do terreno é liberado na primeira parcela
      if(i == 1 && valorTerreno > 0){
        valorAcumulado = valorTerreno;
      }
      else{
        valorAcumulado += valorTerreno;
      }             

      acumuladoAnterior = valorAcumulado;

      // parcela = saldo acumulado * taxa mensal
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
