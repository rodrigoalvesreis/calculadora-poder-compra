
import {
  Directive,
  HostListener,
  ElementRef,
  forwardRef,
  Input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Directive({
  selector: 'input[appCurrencyMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  @Input() min?: number; // opcional
  @Input() max?: number; // opcional

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private composing = false;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  // ---------- ControlValueAccessor ----------

  writeValue(value: number | string | null): void {
    const input = this.el.nativeElement;
    if (value === null || value === undefined || value === '') {
      input.value = '';
      return;
    }
    const num = typeof value === 'number' ? value : this.parseToNumber(String(value));
    input.value = this.formatToMask(num);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  // ---------- Listeners ----------

  @HostListener('compositionstart')
  onCompositionStart() {
    this.composing = true;
  }

  @HostListener('compositionend', ['$event'])
  onCompositionEnd(event: InputEvent) {
    this.composing = false;
    this.onInput(event);
  }

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    if (this.composing) return;

    const input = this.el.nativeElement;
    const raw = input.value;

    // Mantém apenas dígitos
    const digits = raw.replace(/\D+/g, '');

    // Se vazio, zera
    if (!digits) {
      input.value = '';
      this.onChange(null);
      return;
    }

    // Constrói número com 2 casas decimais
    const cents = this.ensureTwoDecimals(digits);
    let num = Number(cents) / 100;

    // Limites opcionais
    if (this.min !== undefined) num = Math.max(num, this.min);
    if (this.max !== undefined) num = Math.min(num, this.max);

    // Reaplica a máscara
    const caretPos = input.selectionStart ?? raw.length;
    const beforeLen = input.value.length;

    input.value = this.formatToMask(num);

    // Ajuste simples do caret
    const afterLen = input.value.length;
    const delta = afterLen - beforeLen;
    const newPos = Math.max(0, caretPos + delta);
    input.setSelectionRange(newPos, newPos);

    this.onChange(num);
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
    const input = this.el.nativeElement;
    if (!input.value || !input.value.replace(/\D+/g, '')) {
      input.value = '';
      this.onChange(null);
      return;
    }
    const num = this.parseToNumber(input.value);
    input.value = this.formatToMask(num);
  }

  // ---------- Helpers ----------

  /** Garante 2 casas decimais (centavos) a partir de string só de dígitos */
  private ensureTwoDecimals(digits: string): string {
    if (digits.length === 1) return '00' + digits;
    if (digits.length === 2) return '0' + digits;
    return digits;
  }

  /** Formata número para '###.###.##0,00' (pt-BR) */
  private formatToMask(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /** Converte string pt-BR em número JS */
  private parseToNumber(input: string): number {
    const sanitized = input
      .replace(/\./g, '')   // remove milhares
      .replace(',', '.');   // vírgula -> ponto decimal
    const num = Number(sanitized);
    return Number.isFinite(num) ? num : 0;
  }
}
