import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export class ResultadoCalculo {
  constructor(
    public valorImovel: number = 0,          // preço total do imóvel
    public valorFinanciado: number = 0,      // 80% do imóvel
    public valorEntrada: number = 0,         // 20% do imóvel
    public jurosNominal: number = 0,         // taxa nominal a.a.
    public jurosEfetivo: number = 0,         // taxa efetiva a.a.
    public primeiraParcela: number = 0,      // primeira parcela
    public ultimaParcela: number = 0,        // última parcela
    public rendaNecessaria: number | null = null // renda necessária (quando tipo = 'imovel')
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class FinanciamentoService {

  private taxaNominal = environment.taxaNominal || 0.095;

  constructor() {}

  /**
   * @param valorImovelOuRenda Valor do imóvel OU da renda mensal
   * @param prazoAnos Prazo em anos
   * @param sistema Sistema de amortização: 'sac' ou 'price'
   * @param tipo Tipo da entrada: 'imovel' ou 'renda'
   */
  calcularFinanciamento(
    valorImovelOuRenda: number,
    prazoAnos: number,
    sistema: 'sac' | 'price',
    tipo: 'imovel' | 'renda'
  ): ResultadoCalculo {
    const prazoMeses = prazoAnos * 12;
    const jurosNominal = this.taxaNominal;
    const taxaMensal = Math.pow(1 + jurosNominal, 1 / 12) - 1;
    const jurosEfetivo = Math.pow(1 + taxaMensal, 12) - 1;

    let valorImovel = 0;
    let valorFinanciado = 0;
    let valorEntrada = 0;
    let primeiraParcela = 0;
    let ultimaParcela = 0;
    let rendaNecessaria: number | null = null;

    if (tipo === 'imovel') {
      // valor informado é o preço total do imóvel
      valorImovel = valorImovelOuRenda;
      valorFinanciado = valorImovel * 0.8;   // 80% financiado
      valorEntrada = valorImovel * 0.2;      // 20% entrada

      if (sistema === 'price') {
        primeiraParcela = valorFinanciado * taxaMensal / (1 - Math.pow(1 + taxaMensal, -prazoMeses));
        ultimaParcela = primeiraParcela;
      } else {
        const amortizacao = valorFinanciado / prazoMeses;
        primeiraParcela = amortizacao + (valorFinanciado * taxaMensal);
        ultimaParcela = amortizacao + (amortizacao * taxaMensal);
      }

      // renda necessária = parcela / 30%
      rendaNecessaria = primeiraParcela / 0.3;

    } else if (tipo === 'renda') {
      // valor informado é a renda mensal
      const parcelaMaxima = valorImovelOuRenda * 0.3;

      if (sistema === 'price') {
        valorFinanciado = parcelaMaxima * (1 - Math.pow(1 + taxaMensal, -prazoMeses)) / taxaMensal;
        primeiraParcela = parcelaMaxima;
        ultimaParcela = primeiraParcela;
      } else {
        valorFinanciado = parcelaMaxima / (1 / prazoMeses + taxaMensal);
        const amortizacao = valorFinanciado / prazoMeses;
        primeiraParcela = amortizacao + (valorFinanciado * taxaMensal);
        ultimaParcela = amortizacao + (amortizacao * taxaMensal);
      }

      // calcular valor total do imóvel a partir do financiamento (80%)
      valorImovel = valorFinanciado / 0.8;
      valorEntrada = valorImovel * 0.2;
    }

    return new ResultadoCalculo(
      Number(valorImovel.toFixed(2)),
      Number(valorFinanciado.toFixed(2)),
      Number(valorEntrada.toFixed(2)),
      Number(jurosNominal.toFixed(4)),
      Number(jurosEfetivo.toFixed(4)),
      Number(primeiraParcela.toFixed(2)),
      Number(ultimaParcela.toFixed(2)),
      rendaNecessaria ? Number(rendaNecessaria.toFixed(2)) : null
    );
  }
}