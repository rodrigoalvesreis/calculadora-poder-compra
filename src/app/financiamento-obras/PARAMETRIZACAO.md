# Parametrização do Financiamento de Obras

## Visão Geral

O sistema de Financiamento de Obras foi parametrizado para suportar 3 modalidades diferentes, cada uma com suas próprias configurações de:
- Taxa de juros efetiva
- LTV (Loan-to-Value) por sistema de amortização
- Prazos mínimos e máximos
- Valores mínimos e máximos de financiamento

## Modalidades Configuradas

### 1. Imóvel na Planta
- **Taxa de Juros**: 11,49% a.a.
- **LTV SAC**: 80% | **LTV PRICE**: 70%
- **Prazo Amortização (Mínimo)**: SAC 120 meses | PRICE 120 meses
- **Prazo Amortização (Máximo)**: SAC 420 meses | PRICE 360 meses
- **Valor Financiamento**: Min R$ 100.000,00 | Máx R$ 2.250.000,00

### 2. Construção em Terreno Próprio
- **Taxa de Juros**: 12% a.a.
- **LTV SAC**: 80% | **LTV PRICE**: 70%
- **Prazo Amortização (Mínimo)**: SAC 120 meses | PRICE 120 meses
- **Prazo Amortização (Máximo)**: SAC 420 meses | PRICE 360 meses
- **Valor Financiamento**: Min R$ 150.000,00 | Máx R$ 2.250.000,00

### 3. Aquisição de Terreno + Construção
- **Taxa de Juros**: 12% a.a.
- **LTV SAC**: 80% | **LTV PRICE**: 70%
- **Prazo Amortização (Mínimo)**: SAC 120 meses | PRICE 120 meses
- **Prazo Amortização (Máximo)**: SAC 420 meses | PRICE 360 meses
- **Valor Financiamento**: Min R$ 150.000,00 | Máx R$ 2.250.000,00

## Arquivos Envolvidos

### Configuração
- `src/environments/environment.ts` - Configurações para desenvolvimento
- `src/environments/environment.prod.ts` - Configurações para produção

### Serviço e Modelos
- `src/app/financiamento-obras/financiamento-obras.service.ts` - Serviço com cálculos
- `src/app/financiamento-obras/financiamento-obras.models.ts` - Interfaces e tipos
- `src/app/financiamento-obras/financiamento-obras.utils.ts` - Funções utilitárias

### Componentes
- `src/app/financiamento-obras/imovel-planta/` - Componente para Imóvel na Planta
- `src/app/financiamento-obras/construcao-terreno/` - Componente para Construção em Terreno Próprio
- `src/app/financiamento-obras/terreno-construcao/` - Componente para Aquisição de Terreno + Construção

## Como Usar no Componente

### Exemplo: Imovel na Planta

```typescript
import { Component } from '@angular/core';
import { FinanciamentoObrasService } from '../financiamento-obras.service';
import { FinanciamentoObrasUtils } from '../financiamento-obras.utils';

@Component({
  selector: 'app-imovel-planta',
  templateUrl: './imovel-planta.component.html',
  styleUrls: ['./imovel-planta.component.css']
})
export class ImovelPlantaComponent {
  
  constructor(private financiamentoService: FinanciamentoObrasService) {}

  onSubmit() {
    const resultado = this.financiamentoService.calcularFinanciamentoComParametros(
      'imovelPlanta',  // tipo de modalidade
      0,               // valorTerreno
      dados.valorImovel,
      dados.prazoObra,
      dados.percentualExecutado,
      dados.prazoFinanciamento,
      dados.sistema
    );

    // Acessar validações
    if (resultado.validacoes.isValido) {
      // Usar resultado do cálculo
      console.log('Planilha:', resultado.faseObras);
    } else {
      // Mostrar erros
      console.error('Erros:', resultado.validacoes.erros);
    }
  }

  // Usar utilitários para exibir informações
  obterTaxaAnual() {
    return FinanciamentoObrasUtils.getTaxaAnualEmPercentual('imovelPlanta');
  }

  obterValorMinimo() {
    return FinanciamentoObrasUtils.getValorMinimoFormatado('imovelPlanta');
  }

  obterValorMaximo() {
    return FinanciamentoObrasUtils.getValorMaximoFormatado('imovelPlanta');
  }

  obterPrazos() {
    return FinanciamentoObrasUtils.getPrazosAmortizacao('imovelPlanta', 'PRICE');
  }
}
```

### Exemplo: Construção em Terreno Próprio

```typescript
onSubmit() {
  const resultado = this.financiamentoService.calcularFinanciamentoComParametros(
    'construcaoTerreno',  // tipo de modalidade
    0,
    dados.valorObra,
    dados.prazoObra,
    dados.percentualExecutado,
    dados.prazoTotal,
    dados.sistema
  );
}
```

### Exemplo: Aquisição de Terreno + Construção

```typescript
onSubmit() {
  const resultado = this.financiamentoService.calcularFinanciamentoComParametros(
    'terrenoConstrucao',  // tipo de modalidade
    dados.valorTerreno,
    dados.valorObra,
    dados.prazoObra,
    dados.percentualExecutado,
    dados.prazoTotal,
    dados.sistema
  );
}
```

## Estrutura do Retorno

O método `calcularFinanciamentoComParametros` retorna um objeto com:

```typescript
{
  faseObras: Parcela[],              // Array com parcelas da fase de obras
  faseAmortizacao: Parcela[],        // Array com parcelas da fase de amortização
  custoTotalObra: number,            // Total de juros/custos da fase de obras
  custoTotalAmortizacao: number,     // Total de juros/custos da fase de amortização
  cetEfetivo: number,                // Taxa efetiva (da modalidade)
  taxaJuros: number,                 // Taxa de juros (da modalidade)
  timeline: TimelineEtapa[],         // Timeline dos marcos da operação
  validacoes: {
    isValido: boolean,               // Se passou em todas as validações
    erros: string[],                 // Erros encontrados
    avisos: string[]                 // Avisos (para futuro uso)
  }
}
```

## Validações Automáticas

O serviço valida automaticamente:
- ✅ Valor de financiamento dentro dos limites (mín/máx)
- ✅ Prazo de amortização dentro dos limites (mín/máx para o sistema)
- ✅ Correspondência de configuração entre modalidade e sistema

## Compatibilidade com Código Legado

O método antigo `calcularConstrucaoTerreno()` foi mantido por compatibilidade, mas é **DEPRECATED**. 
Use `calcularFinanciamentoComParametros()` para novos desenvolvimentos.

## Configuração (Environment)

Exemplo de estrutura em `environment.ts`:

```typescript
financiamentoObrasConfig: {
  imovelPlanta: {
    taxaEfetiva: 0.1149,
    ltv: { SAC: 0.80, PRICE: 0.70 },
    prazoAmortizacao: {
      minimo: { SAC: 120, PRICE: 120 },
      maximo: { SAC: 420, PRICE: 360 }
    },
    valorFinanciamento: {
      minimo: 100000,
      maximo: 2250000
    }
  },
  // ... outras modalidades
}
```

Para modificar parâmetros, edite o arquivo `environment.ts` (desenvolvimento) ou `environment.prod.ts` (produção).
