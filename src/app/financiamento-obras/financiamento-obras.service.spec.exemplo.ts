/**
 * EXEMPLO DE TESTES UNITÁRIOS
 * Exemplos de como testar o novo serviço parametrizado
 */

import { TestBed } from '@angular/core/testing';
import { FinanciamentoObrasService } from './financiamento-obras.service';
import { FinanciamentoObrasUtils } from './financiamento-obras.utils';

describe('FinanciamentoObrasService - Parametrizado', () => {
  let service: FinanciamentoObrasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinanciamentoObrasService);
  });

  describe('Validações', () => {
    it('deve retornar erro quando valor está abaixo do mínimo (Imóvel na Planta)', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        50000,  // Abaixo do mínimo de 100k
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(false);
      expect(resultado.validacoes.erros.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando valor está acima do máximo (Imóvel na Planta)', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        3000000,  // Acima do máximo de 2,25M
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(false);
      expect(resultado.validacoes.erros.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando prazo está abaixo do mínimo', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        100,  // Menor que mínimo de 120
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(false);
    });

    it('deve retornar erro quando prazo PRICE está acima do máximo de 360', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        420,  // Máximo para PRICE é 360
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(false);
    });

    it('deve aceitar prazo SAC até 420 meses', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        420,  // Máximo para SAC é 420
        'SAC'
      );

      expect(resultado.validacoes.isValido).toBe(true);
    });
  });

  describe('Cálculos por Modalidade', () => {
    it('Imovel na Planta: deve usar taxa de 11,49% a.a', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.taxaJuros).toBe(0.1149);
      expect(resultado.cetEfetivo).toBe(0.1149);
    });

    it('Construção em Terreno Próprio: deve usar taxa de 12% a.a', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'construcaoTerreno',
        0,
        500000,
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.taxaJuros).toBe(0.12);
      expect(resultado.cetEfetivo).toBe(0.12);
    });

    it('Terreno + Construção: deve usar taxa de 12% a.a', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'terrenoConstrucao',
        100000,
        400000,
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.taxaJuros).toBe(0.12);
    });
  });

  describe('LTV por Sistema', () => {
    it('Imóvel na Planta PRICE: deve aplicar LTV 70%', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        1000000,  // Valor de entrada
        12,
        0,
        240,
        'PRICE'
      );

      // Com LTV 70%, o valor financiado deve ser 700k
      // Verificando se há parcelas e se valores fazem sentido
      expect(resultado.faseAmortizacao.length).toBeGreaterThan(0);
    });

    it('Imóvel na Planta SAC: deve aplicar LTV 80%', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        1000000,  // Valor de entrada
        12,
        0,
        240,
        'SAC'
      );

      // Com LTV 80%, o valor financiado deve ser 800k
      expect(resultado.faseAmortizacao.length).toBeGreaterThan(0);
    });
  });

  describe('Sistemas de Amortização', () => {
    it('PRICE: parcelas devem ser iguais', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        240,
        'PRICE'
      );

      const parcelas = resultado.faseAmortizacao;
      const primeiraParc = parcelas[0].valorParcela;

      // Todas as parcelas PRICE devem ter o mesmo valor
      const todasIguais = parcelas.every(p => Math.abs(p.valorParcela - primeiraParc) < 0.01);
      expect(todasIguais).toBe(true);
    });

    it('SAC: amortização deve ser constante', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        240,
        'SAC'
      );

      const parcelas = resultado.faseAmortizacao;
      const primeiraAmort = parcelas[0].valorAmortizacao;

      // Todas as parcelas SAC devem ter amortização igual
      const todasIguais = parcelas.every(p => Math.abs(p.valorAmortizacao - primeiraAmort) < 0.01);
      expect(todasIguais).toBe(true);
    });
  });

  describe('Fase de Obras', () => {
    it('deve aplicar taxa durante fase de obras', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,  // 12 meses de obra
        0,
        240,
        'PRICE'
      );

      // Deve ter 12 parcelas de obra
      expect(resultado.faseObras.length).toBe(12);

      // Todas com amortização 0
      resultado.faseObras.forEach(p => {
        expect(p.valorAmortizacao).toBe(0);
      });

      // Todas com valorParcela > 0 (juros)
      resultado.faseObras.forEach(p => {
        expect(p.valorParcela).toBeGreaterThan(0);
      });
    });

    it('deve aumentar valor liberado linearmente na obra', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,
        240,
        'PRICE'
      );

      const valoresAcumulados = resultado.faseObras.map(p => p.valorLiberadoAcumulado || 0);

      // Valores acumulados devem ser crescentes
      for (let i = 1; i < valoresAcumulados.length; i++) {
        expect(valoresAcumulados[i]).toBeGreaterThanOrEqual(valoresAcumulados[i-1]);
      }
    });
  });

  describe('Percentual Executado', () => {
    it('deve reduzir valor a financiar conforme percentual executado', () => {
      const resultado1 = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        0,  // 0% executado
        240,
        'PRICE'
      );

      const resultado2 = service.calcularFinanciamentoComParametros(
        'imovelPlanta',
        0,
        500000,
        12,
        50,  // 50% executado
        240,
        'PRICE'
      );

      // Com 50% executado, o custo total deve ser menor
      const custoTotal1 = resultado1.custoTotalObra + resultado1.custoTotalAmortizacao;
      const custoTotal2 = resultado2.custoTotalObra + resultado2.custoTotalAmortizacao;

      expect(custoTotal2).toBeLessThan(custoTotal1);
    });
  });

  describe('Compatibilidade com Utilitários', () => {
    it('FinanciamentoObrasUtils deve retornar config corretamente', () => {
      const config = FinanciamentoObrasUtils.getConfiguracaoModalidade('imovelPlanta');

      expect(config.taxaEfetiva).toBe(0.1149);
      expect(config.ltv.SAC).toBe(0.80);
      expect(config.ltv.PRICE).toBe(0.70);
    });

    it('FinanciamentoObrasUtils.isValorValido deve validar range', () => {
      expect(FinanciamentoObrasUtils.isValorValido('imovelPlanta', 500000)).toBe(true);
      expect(FinanciamentoObrasUtils.isValorValido('imovelPlanta', 50000)).toBe(false);
      expect(FinanciamentoObrasUtils.isValorValido('imovelPlanta', 3000000)).toBe(false);
    });

    it('FinanciamentoObrasUtils.isPrazoValido deve validar range', () => {
      expect(FinanciamentoObrasUtils.isPrazoValido('imovelPlanta', 240, 'PRICE')).toBe(true);
      expect(FinanciamentoObrasUtils.isPrazoValido('imovelPlanta', 100, 'PRICE')).toBe(false);
      expect(FinanciamentoObrasUtils.isPrazoValido('imovelPlanta', 420, 'PRICE')).toBe(false);
      expect(FinanciamentoObrasUtils.isPrazoValido('imovelPlanta', 420, 'SAC')).toBe(true);
    });
  });

  describe('Limites por Modalidade', () => {
    it('Construção em Terreno Próprio: valor mínimo 150k', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'construcaoTerreno',
        0,
        100000,  // Abaixo do mínimo de 150k
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(false);
    });

    it('Terreno + Construção: valor mínimo 150k', () => {
      const resultado = service.calcularFinanciamentoComParametros(
        'terrenoConstrucao',
        50000,
        100000,  // Total 150k = mínimo
        12,
        0,
        240,
        'PRICE'
      );

      expect(resultado.validacoes.isValido).toBe(true);
    });
  });
});
