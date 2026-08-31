/**
 * EXEMPLO: Como Atualizar os Componentes
 * 
 * Este arquivo mostra exemplos de como atualizar cada componente especializado
 * para usar o novo método parametrizado calcularFinanciamentoComParametros()
 */

// ============================================================================
// EXEMPLO 1: Componente ImovelPlantaComponent
// ============================================================================

/*
Arquivo: imovel-planta/imovel-planta.component.ts

ANTES (usando método legado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
      0,  // valorTerreno sempre 0
      dados.valorImovel,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoFinanciamento,
      dados.sistema
    );
    this.mostrarPlanilha = false;
  }
}
---

DEPOIS (usando novo método parametrizado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularFinanciamentoComParametros(
      'imovelPlanta',  // Modalidade específica
      0,               // valorTerreno
      dados.valorImovel,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoFinanciamento,
      dados.sistema
    );
    
    // Novo: Adicionar validação
    if (!this.resultadoCalculo.validacoes.isValido) {
      this.mostrarErros(this.resultadoCalculo.validacoes.erros);
      return;
    }
    
    this.mostrarPlanilha = false;
  }
}

// Novo: Método para mostrar erros
mostrarErros(erros: string[]): void {
  // Implementar lógica de exibição de erros
  console.error('Erros de validação:', erros);
  // Pode usar ToastService, modal, ou atualizar template
}
*/

// ============================================================================
// EXEMPLO 2: Componente ConstrucaoTerrenoComponent
// ============================================================================

/*
Arquivo: construcao-terreno/construcao-terreno.component.ts

ANTES (usando método legado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
      0,  // valorTerreno sempre 0 (terreno próprio)
      dados.valorObra,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoTotal,
      dados.sistema
    );
    this.mostrarPlanilha = false;
  }
}
---

DEPOIS (usando novo método parametrizado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularFinanciamentoComParametros(
      'construcaoTerreno',  // Modalidade específica
      0,                    // valorTerreno (não há terreno a financiar)
      dados.valorObra,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoTotal,
      dados.sistema
    );
    
    // Validação automática
    if (!this.resultadoCalculo.validacoes.isValido) {
      this.errosValidacao = this.resultadoCalculo.validacoes.erros;
      return;
    }
    
    this.mostrarPlanilha = false;
  }
}
*/

// ============================================================================
// EXEMPLO 3: Componente TerrenoConstrucaoComponent
// ============================================================================

/*
Arquivo: terreno-construcao/terreno-construcao.component.ts

ANTES (usando método legado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularConstrucaoTerreno(
      dados.valorTerreno,
      dados.valorObra,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoTotal,
      dados.sistema
    );
    this.mostrarPlanilha = false;
  }
}
---

DEPOIS (usando novo método parametrizado):
---
onSubmit(): void {
  if (this.financiamentoForm.valid) {
    const dados = this.financiamentoForm.value;
    this.resultadoCalculo = this.financiamentoService.calcularFinanciamentoComParametros(
      'terrenoConstrucao',  // Modalidade específica
      dados.valorTerreno,
      dados.valorObra,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoTotal,
      dados.sistema
    );
    
    // Tratar validações
    if (!this.resultadoCalculo.validacoes.isValido) {
      this.mostrarToast('Validação', this.resultadoCalculo.validacoes.erros.join('\n'));
      return;
    }
    
    this.mostrarPlanilha = false;
  }
}
*/

// ============================================================================
// EXEMPLO 4: Usando Utilitários nos Templates
// ============================================================================

/*
Exemplo: imovel-planta.component.html

Para exibir informações parametrizadas no template, você pode:

1. Importar FinanciamentoObrasUtils no componente:
   import { FinanciamentoObrasUtils } from '../financiamento-obras.utils';
   
   FinanciamentoObrasUtils: typeof FinanciamentoObrasUtils = FinanciamentoObrasUtils;

2. No template, usar os utilitários:
   <div class="alert alert-info">
     <p>Taxa: {{ FinanciamentoObrasUtils.getTaxaAnualEmPercentual('imovelPlanta') }}% a.a.</p>
     <p>Valor Mínimo: {{ FinanciamentoObrasUtils.getValorMinimoFormatado('imovelPlanta') }}</p>
     <p>Valor Máximo: {{ FinanciamentoObrasUtils.getValorMaximoFormatado('imovelPlanta') }}</p>
   </div>
   
   <div class="form-group">
     <label>Prazo (meses):</label>
     <input type="number" 
            [min]="FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', 'PRICE').minimo"
            [max]="FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', 'PRICE').maximo">
   </div>
*/

// ============================================================================
// EXEMPLO 5: Validação em Tempo Real
// ============================================================================

/*
Exemplo: Validar valor de entrada em tempo real

export class ImovelPlantaComponent {
  valorImovel: number = 0;
  erros: string[] = [];
  
  onValorChange(novoValor: number): void {
    this.valorImovel = novoValor;
    
    if (!FinanciamentoObrasUtils.isValorValido('imovelPlanta', novoValor)) {
      const config = FinanciamentoObrasUtils.getConfiguracaoModalidade('imovelPlanta');
      this.erros = [
        `Valor deve estar entre R$ ${config.valorFinanciamento.minimo.toLocaleString('pt-BR')} e R$ ${config.valorFinanciamento.maximo.toLocaleString('pt-BR')}`
      ];
    } else {
      this.erros = [];
    }
  }
  
  onSistemaChange(sistema: 'PRICE' | 'SAC'): void {
    const prazoAtual = this.financiamentoForm.get('prazoFinanciamento')?.value;
    
    if (!FinanciamentoObrasUtils.isPrazoValido('imovelPlanta', prazoAtual, sistema)) {
      const prazos = FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', sistema);
      this.erros = [
        `Prazo deve estar entre ${prazos.minimo} e ${prazos.maximo} meses`
      ];
      // Resetar prazo para valor válido
      this.financiamentoForm.patchValue({
        prazoFinanciamento: prazos.minimo
      });
    }
  }
}
*/

// ============================================================================
// RESUMO DAS ALTERAÇÕES
// ============================================================================

/*
PRINCIPAIS MUDANÇAS:

1. Substituir chamada do método:
   ❌ this.financiamentoService.calcularConstrucaoTerreno()
   ✅ this.financiamentoService.calcularFinanciamentoComParametros()

2. Adicionar modalidade como primeiro parâmetro:
   ❌ calcularConstrucaoTerreno(valorTerreno, valorObra, ...)
   ✅ calcularFinanciamentoComParametros('imovelPlanta', valorTerreno, valorObra, ...)

3. Sempre verificar validações:
   if (resultado.validacoes.isValido) {
     // usar resultado
   } else {
     // mostrar erros: resultado.validacoes.erros
   }

4. Usar FinanciamentoObrasUtils para:
   - Exibir parâmetros no UI
   - Validar entrada em tempo real
   - Obter limites dinâmicos
   - Formatar informações

BENEFÍCIOS:

✅ Parâmetros centralizados (fácil de atualizar)
✅ Validação automática
✅ LTV dinâmico por sistema
✅ Taxa específica por modalidade
✅ Prazo ajustável conforme sistema
✅ Utilitários para facilitar UI
*/
