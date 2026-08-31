import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FinanciamentoObrasService } from '../financiamento-obras.service';
import { ResultadoCalculoFinanciamento } from '../financiamento-obras.models';
import { FinanciamentoObrasUtils } from '../financiamento-obras.utils';

@Component({
  selector: 'app-construcao-terreno',
  templateUrl: './construcao-terreno.component.html',
  styleUrls: ['./construcao-terreno.component.css'],
  providers: [CurrencyPipe]
})
export class ConstrucaoTerrenoComponent implements OnInit {
  financiamentoForm!: FormGroup;
  resultadoCalculo!: ResultadoCalculoFinanciamento;
  errosValidacao: string[] = [];
  mostrarPlanilha = false; // controla exibição da planilha

  // Limites dinâmicos da configuração
  valorObraMin: number = 0;
  valorObraMax: number = 0;
  prazoAmortizacaoMin: number = 120;
  prazoAmortizacaoMax: number = 360;

  constructor(
    private fb: FormBuilder,
    private currencyPipe: CurrencyPipe,
    private financiamentoService: FinanciamentoObrasService
  ) {}

  ngOnInit(): void {
    this.financiamentoForm = this.fb.group({
      valorObra: [null, [Validators.required]],
      prazoObra: [null, [Validators.required, Validators.min(4), Validators.max(12)]],
      percentualExecutado: [0, [Validators.min(0), Validators.max(100)]],
      prazoTotal: [null, [Validators.required, Validators.min(this.prazoAmortizacaoMin), Validators.max(this.prazoAmortizacaoMax)]],
      sistema: ['PRICE', Validators.required]
    });

    this.atualizarValidatorsValor('PRICE');

    // Atualizar validators de prazo quando sistema mudar
    this.financiamentoForm.get('sistema')?.valueChanges.subscribe((sistema: 'PRICE' | 'SAC') => {
      this.atualizarValidatorsValor(sistema);
      this.atualizarValidatorsPrazo(sistema);
      this.limparResultado();
    });

    this.financiamentoForm.get('prazoObra')?.valueChanges.subscribe(() => {
      const sistema = this.financiamentoForm.get('sistema')?.value ?? 'PRICE';
      this.atualizarValidatorsPrazo(sistema);
      this.limparResultado();
    });

    Object.keys(this.financiamentoForm.controls).forEach(key => {
      this.financiamentoForm.get(key)?.valueChanges.subscribe(() => {
        this.limparResultado();
      });
    });
  }

  private limparResultado(): void {
    this.resultadoCalculo = undefined as any;
    this.mostrarPlanilha = false;
    this.errosValidacao = [];
  }

  private atualizarValidatorsValor(sistema: 'PRICE' | 'SAC'): void {
    const config = FinanciamentoObrasUtils.getConfiguracaoModalidade('construcaoTerreno');
    const ltv = config.ltv[sistema];
    const valorMinPermitido = config.valorFinanciamento.minimo / ltv;
    const valorMaxPermitido = config.valorFinanciamento.maximo / ltv;

    this.valorObraMin = valorMinPermitido;
    this.valorObraMax = valorMaxPermitido;

    const valorObraControl = this.financiamentoForm.get('valorObra');
    if (valorObraControl) {
      valorObraControl.setValidators([
        Validators.required,
        Validators.min(valorMinPermitido),
        Validators.max(valorMaxPermitido)
      ]);
      valorObraControl.updateValueAndValidity();
    }
  }

  private atualizarValidatorsPrazo(sistema: 'PRICE' | 'SAC'): void {
    const prazos = FinanciamentoObrasUtils.getPrazosAmortizacao('construcaoTerreno', sistema);
    const prazoObra = Number(this.financiamentoForm.get('prazoObra')?.value || 0);
    const prazoTotalControl = this.financiamentoForm.get('prazoTotal');
    const prazoMinimo = prazos.minimo + prazoObra;
    const prazoMaximo = prazos.maximo + prazoObra;

    if (prazoTotalControl) {
      const valorAtual = Number(prazoTotalControl.value || 0);
      if (!prazoTotalControl.value || valorAtual < prazoMinimo) {
        prazoTotalControl.setValue(prazoMinimo, { emitEvent: false });
      }

      prazoTotalControl.setValidators([
        Validators.required,
        Validators.min(prazoMinimo),
        Validators.max(prazoMaximo)
      ]);
      prazoTotalControl.updateValueAndValidity();
    }

    this.prazoAmortizacaoMin = prazos.minimo;
    this.prazoAmortizacaoMax = prazos.maximo;
  }

  get prazoAmortizacao(): number {
    const prazoObra = this.financiamentoForm.get('prazoObra')?.value || 0;
    const prazoTotal = this.financiamentoForm.get('prazoTotal')?.value || 0;
    return prazoTotal > 0 ? prazoTotal - prazoObra : 0;
  }

  formatarMoeda(event: any) {
    const valorTexto = event.target.value ?? '';
    const apenasDigitos = valorTexto.replace(/\D/g, '');

    if (apenasDigitos === '') {
      event.target.value = '';
      this.financiamentoForm.get('valorObra')?.setValue(null);
      return;
    }

    const valorNumerico = Number(apenasDigitos);
    const valorFormatado = this.currencyPipe.transform(valorNumerico, 'BRL', 'symbol', '1.2-2', 'pt-BR');
    event.target.value = valorFormatado ?? '';
    this.financiamentoForm.get('valorObra')?.setValue(valorNumerico);
  }

  /**
   * Verifica se um campo do formulário tem erro de validação
   * Retorna true se o campo foi tocado (dirty/touched) e tem erro
   */
  hasError(fieldName: string): boolean {
    const field = this.financiamentoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    // Marcar todos os campos como tocados para mostrar erros
    Object.keys(this.financiamentoForm.controls).forEach(key => {
      this.financiamentoForm.get(key)?.markAsTouched();
    });

    if (this.financiamentoForm.valid) {
      const dados = this.financiamentoForm.value;
      this.resultadoCalculo = this.financiamentoService.calcularFinanciamentoComParametros(
        'construcaoTerreno',
        0,
        dados.valorObra,
        dados.prazoObra,
        dados.percentualExecutado,
        dados.prazoTotal,
        dados.sistema
      );

      // Validar resultado
      if (!this.resultadoCalculo.validacoes.isValido) {
        this.errosValidacao = this.resultadoCalculo.validacoes.erros;
        return;
      }

      this.errosValidacao = [];
      this.mostrarPlanilha = false; // reseta a planilha ao recalcular
    } else {
      // Se form inválido, mostrar todos os erros de validação do form
      this.errosValidacao = [];
      Object.keys(this.financiamentoForm.controls).forEach(key => {
        const control = this.financiamentoForm.get(key);
        if (control?.errors) {
          if (control.errors['required']) {
            this.errosValidacao.push(`Campo "${key}" é obrigatório`);
          }
          if (control.errors['min']) {
            this.errosValidacao.push(`Campo "${key}" deve ser no mínimo ${control.errors['min'].min}`);
          }
          if (control.errors['max']) {
            this.errosValidacao.push(`Campo "${key}" deve ser no máximo ${control.errors['max'].max}`);
          }
        }
      });
    }
  }
}
