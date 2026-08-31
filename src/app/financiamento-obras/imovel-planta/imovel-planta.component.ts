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
      dataNascimento: [null, [Validators.required]],
      valorAvaliacaoEngenharia: [null, [Validators.required]],
      prazoObra: [null, [Validators.required, Validators.min(4), Validators.max(36)]],
      percentualExecutado: [0, [Validators.min(0), Validators.max(100)]],
      prazoFinanciamento: [null, [Validators.required, Validators.min(this.prazoFinanciamentoMin), Validators.max(this.prazoFinanciamentoMax)]],
      sistema: ['PRICE', Validators.required]
    }, {
      validators: [this.validarIdadeFinalContrato.bind(this)]
    });

    this.atualizarValidatorsValor('PRICE');
    this.atualizarValidadoresIdade();

    // Atualizar validators de prazo quando sistema mudar
    this.financiamentoForm.get('sistema')?.valueChanges.subscribe((sistema: 'PRICE' | 'SAC') => {
      this.atualizarValidatorsValor(sistema);
      this.atualizarValidatorsPrazo(sistema);
      this.limparResultado();
    });

    this.financiamentoForm.get('prazoObra')?.valueChanges.subscribe(() => {
      const sistema = this.financiamentoForm.get('sistema')?.value ?? 'PRICE';
      this.atualizarValidatorsPrazo(sistema);
      this.atualizarValidadoresIdade();
      this.limparResultado();
    });

    this.financiamentoForm.get('prazoFinanciamento')?.valueChanges.subscribe(() => {
      this.atualizarValidadoresIdade();
      this.limparResultado();
    });

    this.financiamentoForm.get('dataNascimento')?.valueChanges.subscribe(() => {
      this.atualizarValidadoresIdade();
      this.limparResultado();
    });

    Object.keys(this.financiamentoForm.controls).forEach(key => {
      this.financiamentoForm.get(key)?.valueChanges.subscribe(() => {
        if (key !== 'dataNascimento' && key !== 'prazoFinanciamento' && key !== 'prazoObra') {
          this.limparResultado();
        }
      });
    });
  }

  private atualizarValidadoresIdade(): void {
    const dataNascimento = this.financiamentoForm?.get('dataNascimento')?.value;
    const prazoFinanciamentoControl = this.financiamentoForm?.get('prazoFinanciamento');
    const prazoObra = Number(this.financiamentoForm?.get('prazoObra')?.value || 0);
    const sistema = this.financiamentoForm?.get('sistema')?.value ?? 'PRICE';

    if (!dataNascimento || !prazoFinanciamentoControl) {
      this.financiamentoForm?.updateValueAndValidity();
      return;
    }

    const prazos = FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', sistema);
    const prazoMaximoSistema = prazos.maximo + prazoObra;
    const prazoMaximoPermitido = this.obterPrazoMaximoPermitido(dataNascimento);
    const prazoLimiteFinal = Math.min(prazoMaximoSistema, prazoMaximoPermitido);

    if (Number(prazoFinanciamentoControl.value || 0) > prazoLimiteFinal && prazoLimiteFinal > 0) {
      prazoFinanciamentoControl.setValue(prazoLimiteFinal, { emitEvent: false });
    }

    prazoFinanciamentoControl.setValidators([
      Validators.required,
      Validators.min(prazos.minimo + prazoObra),
      Validators.max(prazoLimiteFinal)
    ]);
    prazoFinanciamentoControl.updateValueAndValidity();
    this.financiamentoForm?.updateValueAndValidity();
  }

  private obterPrazoMaximoPermitido(dataNascimento: string): number {
    const nascimento = new Date(dataNascimento);
    const dataMaxima = new Date(nascimento);
    dataMaxima.setFullYear(dataMaxima.getFullYear() + 80);
    dataMaxima.setMonth(dataMaxima.getMonth() + 6);

    const hoje = new Date();
    let prazoMaximo = 0;
    const dataLimite = new Date(hoje);

    while (dataLimite < dataMaxima) {
      dataLimite.setMonth(dataLimite.getMonth() + 1);
      prazoMaximo++;
    }

    return prazoMaximo;
  }

  private validarIdadeFinalContrato(): { [key: string]: boolean } | null {
    const dataNascimento = this.financiamentoForm?.get('dataNascimento')?.value;
    const prazoTotal = Number(this.financiamentoForm?.get('prazoFinanciamento')?.value || 0);

    if (!dataNascimento || !prazoTotal) {
      return null;
    }

    const idadeAtual = this.calcularIdadeEmAnos(dataNascimento);
    if (idadeAtual < 18 || idadeAtual > 80) {
      return { idadeForaDoIntervaloPermitido: true };
    }

    const prazoMaximoPermitido = this.obterPrazoMaximoPermitido(dataNascimento);
    return prazoTotal > prazoMaximoPermitido && prazoMaximoPermitido > 0 ? { idadeMaiorQuePermitida: true } : null;
  }

  private calcularIdadeEmAnos(dataNascimento: string): number {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
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

  formatarMoedaAvaliacao(event: any) {
    const valorTexto = event.target.value ?? '';
    const apenasDigitos = valorTexto.replace(/\D/g, '');

    if (apenasDigitos === '') {
      event.target.value = '';
      this.financiamentoForm.get('valorAvaliacaoEngenharia')?.setValue(null);
      return;
    }

    const valorNumerico = Number(apenasDigitos);
    const valorFormatado = this.currencyPipe.transform(valorNumerico, 'BRL', 'symbol', '1.2-2', 'pt-BR');
    event.target.value = valorFormatado ?? '';
    this.financiamentoForm.get('valorAvaliacaoEngenharia')?.setValue(valorNumerico);
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

      if (this.financiamentoForm.hasError('idadeMaiorQuePermitida')) {
        this.errosValidacao.push('O prazo foi reduzido para manter a idade máxima de 79 anos no fim do contrato.');
      }

      if (this.financiamentoForm.hasError('idadeForaDoIntervaloPermitido')) {
        this.errosValidacao.push('A idade do cliente deve estar entre 18 e 79 anos.');
      }
    }
  }
}
