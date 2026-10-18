import { TitleCasePipe } from '@angular/common';
import { Directive, ElementRef, HostListener, Input, Pipe, PipeTransform, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export function formatPlate(value: string | null | undefined): string {
  const text = (value ?? '').toUpperCase();
  const raw = text.replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z]{3}[0-9]{1,4}$/.test(raw)) return raw.slice(0, 3) + '-' + raw.slice(3);
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{0,2}$/.test(raw)) return raw;
  return text;
}

@Pipe({ name: 'plateFormat', standalone: true })
export class PlateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string { return formatPlate(value); }
}

@Directive({
  selector: 'input[appDisplayFormat]', standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DisplayFormatDirective), multi: true }],
})
export class DisplayFormatDirective implements ControlValueAccessor {
  @Input() appDisplayFormat: 'title' | 'plate' = 'title';
  private readonly element = inject(ElementRef<HTMLInputElement>);
  private readonly title = new TitleCasePipe();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(value: string | null): void {
    this.element.nativeElement.value = this.appDisplayFormat === 'plate'
      ? formatPlate(value) : this.title.transform(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.element.nativeElement.disabled = disabled; }
  @HostListener('blur') blur(): void { this.onTouched(); }
  @HostListener('input') input(): void {
    const input = this.element.nativeElement;
    const cursor = input.selectionStart ?? input.value.length;
    if (this.appDisplayFormat === 'title') {
      const raw = input.value;
      this.writeValue(raw);
      input.setSelectionRange(cursor, cursor);
      this.onChange(raw);
      return;
    }
    const raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    const position = input.value.slice(0, cursor).replace(/[^a-zA-Z0-9]/g, '').length;
    this.writeValue(raw);
    let caret = 0, count = 0;
    while (caret < input.value.length && count < position) {
      if (/[A-Z0-9]/.test(input.value[caret])) count++;
      caret++;
    }
    input.setSelectionRange(caret, caret);
    this.onChange(raw);
  }
  @HostListener('keydown', ['$event']) keydown(event: KeyboardEvent): void {
    if (this.appDisplayFormat !== 'plate') return;
    const input = this.element.nativeElement;
    const position = input.selectionStart ?? 0;
    if (position !== input.selectionEnd) return;
    const index = event.key === 'Backspace' ? position - 1 : position;
    if (!['Backspace', 'Delete'].includes(event.key) || input.value[index] !== '-') return;
    event.preventDefault();
    const remove = event.key === 'Backspace' ? index - 1 : index + 1;
    input.value = input.value.slice(0, remove) + input.value.slice(remove + 1);
    input.setSelectionRange(remove, remove);
    this.input();
  }
}
