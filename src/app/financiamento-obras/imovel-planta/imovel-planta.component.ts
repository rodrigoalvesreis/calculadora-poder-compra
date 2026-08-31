import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FinanciamentoObrasService } from '../financiamento-obras.service';
import { ResultadoCalculoFinanciamento } from '../financiamento-obras.models';
import { FinanciamentoObrasUtils } from '../financiamento-obras.utils';

@Component({
  selector: 'app-imovel-planta',
  templateUrl: './imovel-planta.component.html',
  styleUrls: ['./imovel-planta.component.css'],
  providers: [CurrencyPipe]
})
export class ImovelPlantaComponent implements OnInit {
  financiamentoForm!: FormGroup;
  resultadoCalculo!: ResultadoCalculoFinanciamento;
  errosValidacao: string[] = [];
  mostrarPlanilha = false; // controla exibição da planilha

  // Limites dinâmicos da configuração
  valorImovelMin: number = 0;
  valorImovelMax: number = 0;
  prazoFinanciamentoMin: number = 120;
  prazoFinanciamentoMax: number = 360;

  constructor(
    private fb: FormBuilder,
    private currencyPipe: CurrencyPipe,
    private financiamentoService: FinanciamentoObrasService
  ) {}

  ngOnInit(): void {
    this.financiamentoForm = this.fb.group({
      valorImovel: [null, [Validators.required]],
      prazoObra: [null, [Validators.required, Validators.min(4), Validators.max(36)]],
      percentualExecutado: [0, [Validators.min(0), Validators.max(100)]],
      prazoFinanciamento: [null, [Validators.required, Validators.min(this.prazoFinanciamentoMin), Validators.max(this.prazoFinanciamentoMax)]],
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
    const config = FinanciamentoObrasUtils.getConfiguracaoModalidade('imovelPlanta');
    const ltv = config.ltv[sistema];
    const valorMinPermitido = config.valorFinanciamento.minimo / ltv;
    const valorMaxPermitido = config.valorFinanciamento.maximo / ltv;

    this.valorImovelMin = valorMinPermitido;
    this.valorImovelMax = valorMaxPermitido;

    const valorImovelControl = this.financiamentoForm.get('valorImovel');
    if (valorImovelControl) {
      valorImovelControl.setValidators([
        Validators.required,
        Validators.min(valorMinPermitido),
        Validators.max(valorMaxPermitido)
      ]);
      valorImovelControl.updateValueAndValidity();
    }
  }

  private atualizarValidatorsPrazo(sistema: 'PRICE' | 'SAC'): void {
    const prazos = FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', sistema);
    const prazoObra = Number(this.financiamentoForm.get('prazoObra')?.value || 0);
    const prazoFinanciamentoControl = this.financiamentoForm.get('prazoFinanciamento');
    const prazoMinimo = prazos.minimo + prazoObra;
    const prazoMaximo = prazos.maximo + prazoObra;

    if (prazoFinanciamentoControl) {
      const valorAtual = Number(prazoFinanciamentoControl.value || 0);
      if (!prazoFinanciamentoControl.value || valorAtual < prazoMinimo) {
        prazoFinanciamentoControl.setValue(prazoMinimo, { emitEvent: false });
      }

      prazoFinanciamentoControl.setValidators([
        Validators.required,
        Validators.min(prazoMinimo),
        Validators.max(prazoMaximo)
      ]);
      prazoFinanciamentoControl.updateValueAndValidity();
    }

    this.prazoFinanciamentoMin = prazos.minimo;
    this.prazoFinanciamentoMax = prazos.maximo;
  }

  get prazoAmortizacao(): number {
    const prazoObra = this.financiamentoForm.get('prazoObra')?.value || 0;
    const prazoFinanciamento = this.financiamentoForm.get('prazoFinanciamento')?.value || 0;
    return prazoFinanciamento > 0 ? prazoFinanciamento - prazoObra : 0;
  }

  formatarMoeda(event: any) {
    const valorTexto = event.target.value ?? '';
    const apenasDigitos = valorTexto.replace(/\D/g, '');

    if (apenasDigitos === '') {
      event.target.value = '';
      this.financiamentoForm.get('valorImovel')?.setValue(null);
      return;
    }

    const valorNumerico = Number(apenasDigitos);
    const valorFormatado = this.currencyPipe.transform(valorNumerico, 'BRL', 'symbol', '1.2-2', 'pt-BR');
    event.target.value = valorFormatado ?? '';
    this.financiamentoForm.get('valorImovel')?.setValue(valorNumerico);
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
        'imovelPlanta',
        0,
        dados.valorImovel,
        dados.prazoObra,
        dados.percentualExecutado,
        dados.prazoFinanciamento,
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
