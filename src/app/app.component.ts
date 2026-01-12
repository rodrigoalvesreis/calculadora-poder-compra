
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CalculatorService, CalculoResultado } from './calculator.service';

type ConsoleStep = {
  titulo: string;
  conteudo: string;
  formula?: string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Calculadora de Poder de Compra';
  resultado?: CalculoResultado;
  erro?: string;
  carregando = false;
  
  activeTab: 'potencial' | 'renda' = 'potencial';


  // Console didático
  consoleOpen = false;
  consoleSteps: ConsoleStep[] = [];

  // Parâmetros padrão (você pode futuramente expor isso na UI)
  readonly params = {
    taxaAnual: 0.10,       // 10% a.a.
    prazoAnos: 30,          // 30 anos
    comprometimento: 0.30,  // 30% da renda
    percEntradaMin: 0.20,   // 20% do valor do imóvel
    percTaxas: 0.05,        // 5% ITBI + taxas
  };

  form = this.fb.group({
    rendaMensal: [null as number | null, [Validators.required, Validators.min(0.01)]],
    entrada: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor(private fb: FormBuilder, private calc: CalculatorService) {}

  formatBRL(n: number): string {
    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }

  formatPct(n: number): string {
    return `${(n * 100).toFixed(2)}%`;
  }

  formatMonthsRate(taxaAnual: number): { taxaMensal: number; pct: string } {
    const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
    return { taxaMensal, pct: `${(taxaMensal * 100).toFixed(4)}% ao mês` };
  }

  toggleConsole(): void {
    this.consoleOpen = !this.consoleOpen;
  }

  onCalcular(): void {
    this.erro = undefined;
    this.resultado = undefined;
    this.consoleSteps = [];

    if (this.form.invalid) {
      this.erro = 'Preencha os campos de renda e entrada com valores válidos.';
      return;
    }

    try {
      this.carregando = true;

      const renda = this.form.value.rendaMensal as number | null;
      const entrada = this.form.value.entrada as number | null;

      if (renda == null || entrada == null) {
        this.erro = 'Informe valores válidos para renda e entrada.';
        return;
      }

      // 1) Calcula resultado com parâmetros padronizados
      const r = this.calc.calcularPoderDeCompra(renda, entrada, this.params);
      this.resultado = r;

      // 2) Monta passos do console didático
      this.consoleSteps = this.buildConsoleSteps(renda, entrada, this.params, r);
    } catch (e: any) {
      this.erro = e?.message ?? 'Erro ao calcular.';
    } finally {
      this.carregando = false;
    }
  }

  private buildConsoleSteps(
    renda: number,
    entrada: number,
    p: typeof this.params,
    r: CalculoResultado
  ): ConsoleStep[] {
    const { taxaMensal, pct } = this.formatMonthsRate(p.taxaAnual);
    const nMeses = Math.round(p.prazoAnos * 12);

    const steps: ConsoleStep[] = [
      {
        titulo: '1) Entradas do usuário',
        conteudo:
          `Renda mensal bruta: ${this.formatBRL(renda)} · ` +
          `Entrada + FGTS: ${this.formatBRL(entrada)}`
      },
      {
        titulo: '2) Parcela máxima pela renda',
        conteudo:
          `Consideramos que a parcela não pode exceder ${this.formatPct(p.comprometimento)} da renda.`,
        formula:
          `parcelaMáxima = renda × ${this.formatPct(p.comprometimento)} = ${this.formatBRL(r.parcelaMaxima)}`
      },
      {
        titulo: '3) Conversão da taxa e prazo',
        conteudo:
          `Taxa anual: ${this.formatPct(p.taxaAnual)} ⇒ Taxa efetiva mensal: ${pct}. ` +
          `Prazo: ${p.prazoAnos} anos ⇒ n = ${nMeses} meses.`,
        formula:
          `i_mensal = (1 + i_anual)^(1/12) − 1`
      },
      {
        titulo: '4) Financiamento máximo pela renda (Tabela Price)',
        conteudo:
          `Com a parcela máxima, calculamos o valor presente (PV) financiável na Tabela Price.`,
        formula:
          `PV = PMT × (1 − (1 + i)^(-n)) / i = ${this.formatBRL(r.financiamentoPorRenda)} ` +
          `onde PMT = ${this.formatBRL(r.parcelaMaxima)}, i = ${pct}, n = ${nMeses}.`
      },
      {
        titulo: '5) Limite pela entrada mínima exigida (20%)',
        conteudo:
          `Bancos normalmente pedem ao menos ${this.formatPct(p.percEntradaMin)} de entrada.`,
        formula:
          `Valor do imóvel mínimo por entrada = Entrada / ${this.formatPct(p.percEntradaMin)} = ${this.formatBRL(entrada / p.percEntradaMin)}\n` +
          `Financiável pela entrada = Valor mínimo − Entrada = ${this.formatBRL(r.financiamentoPorEntrada)}`
      },
      {
        titulo: '6) Financiamento final',
        conteudo:
          `O valor a financiar é o menor entre o limite pela renda e o limite pela entrada.`,
        formula:
          `Financiamento final = min(${this.formatBRL(r.financiamentoPorRenda)}, ${this.formatBRL(r.financiamentoPorEntrada)}) = ${this.formatBRL(r.financiamentoFinal)}`
      },
      {
        titulo: '7) Valor do imóvel (sem taxas)',
        conteudo:
          `Somamos a sua entrada ao financiamento final.`,
        formula:
          `Valor do imóvel = Entrada + Financiamento final = ${this.formatBRL(r.valorImovel)}`
      },
      {
        titulo: '8) ITBI e outras taxas (estimativa)',
        conteudo:
          `Estimamos ${this.formatPct(p.percTaxas)} do valor do imóvel para ITBI e taxas cartorárias.`,
        formula:
          `Taxas ≈ ${this.formatPct(p.percTaxas)} × Valor do imóvel = ${this.formatBRL(r.taxasEstimadas)}`
      },
      {
        titulo: '9) Verificação da suficiência da entrada',
        conteudo:
          r.entradaSuficiente
            ? 'Sua entrada é suficiente para aproveitar o limite de financiamento pela renda.'
            : 'Sua entrada atual é inferior ao mínimo necessário para usar todo o crédito que a renda permitiria.',
        formula:
          `Entrada mínima necessária (para usar todo o crédito pela renda) = ${this.formatPct(p.percEntradaMin)} × (Entrada + Financiamento pela renda) = ${this.formatBRL(r.entradaNecessariaMinima)}`
      },
      {
        titulo: '10) Observações gerais',
        conteudo: r.observacoes.join(' • ')
      }
    ];

    return steps;
  }
}
