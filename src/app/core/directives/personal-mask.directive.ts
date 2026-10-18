import { Directive, ElementRef, HostListener, Input, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatDocument, formatPhone, normalizePhone } from '../utils/personal-data';

@Directive({
  selector: 'input[appPersonalMask]',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PersonalMaskDirective), multi: true }],
})
export class PersonalMaskDirective implements ControlValueAccessor {
  @Input() appPersonalMask: 'document' | 'phone' = 'document';
  private readonly element = inject(ElementRef<HTMLInputElement>);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private normalize(value: string): string {
    return normalizePhone(value);
  }
  writeValue(value: string | null): void {
    this.element.nativeElement.value = this.appPersonalMask === 'phone' ? formatPhone(value) : formatDocument(value);
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.element.nativeElement.disabled = disabled; }
  @HostListener('blur') blur(): void { this.onTouched(); }
  @HostListener('input') input(): void {
    const input = this.element.nativeElement;
    const position = this.normalize(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    this.update(this.normalize(input.value).slice(0, 11), Math.min(position, 11));
  }
  @HostListener('keydown', ['$event']) keydown(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
      const input = this.element.nativeElement;
      const selected = input.selectionStart !== input.selectionEnd;
      if (!/^[0-9]$/.test(event.key) || (!selected && this.normalize(input.value).length >= 11)) {
        event.preventDefault();
      }
      return;
    }
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    const input = this.element.nativeElement;
    const start = input.selectionStart ?? 0;
    if (start !== input.selectionEnd) return;
    const index = event.key === 'Backspace' ? start - 1 : start;
    if (index < 0 || index >= input.value.length || this.normalize(input.value[index])) return;
    const raw = this.normalize(input.value);
    const position = this.normalize(input.value.slice(0, start)).length;
    const remove = event.key === 'Backspace' ? position - 1 : position;
    if (remove < 0 || remove >= raw.length) return;
    event.preventDefault();
    this.update(raw.slice(0, remove) + raw.slice(remove + 1), remove);
  }
  private update(raw: string, position: number): void {
    this.writeValue(raw);
    const input = this.element.nativeElement;
    let caret = 0;
    let count = 0;
    while (caret < input.value.length && count < position) {
      if (this.normalize(input.value[caret])) count++;
      caret++;
    }
    input.setSelectionRange(caret, caret);
    this.onChange(raw);
  }
}
