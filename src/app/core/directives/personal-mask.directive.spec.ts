import { Component, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PersonalMaskDirective } from './personal-mask.directive';
import { formatPhone, matchesPersonalData } from '../utils/personal-data';

@Component({ standalone: false, template: '<input appPersonalMask="document" [(ngModel)]="cpf"><input appPersonalMask="phone" [(ngModel)]="phone">' })
class Form { cpf = '12345678909'; phone = '11987652143'; }
@NgModule({ declarations: [Form], imports: [FormsModule, PersonalMaskDirective] })
class MaskTestModule {}

describe('Máscaras de dados pessoais', () => {
  it('exibe máscaras e mantém o modelo sem pontuação ao colar e apagar', async () => {
    TestBed.configureTestingModule({ imports: [MaskTestModule] });
    const fixture = TestBed.createComponent(Form);
    fixture.detectChanges();
    await fixture.whenStable();
    const [cpf, phone] = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(cpf.value).toBe('123.456.789-09');
    expect(phone.value).toBe('(11) 98765-2143');
    cpf.value = '987.654.321-00';
    cpf.dispatchEvent(new Event('input'));
    phone.value = '(11) 3456-7890';
    phone.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.cpf).toBe('98765432100');
    expect(fixture.componentInstance.phone).toBe('1134567890');
    expect(phone.value).toBe('(11) 3456-7890');
    cpf.setSelectionRange(4, 4);
    cpf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    expect(fixture.componentInstance.cpf).toBe('9865432100');
    phone.value = '';
    phone.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.phone).toBe('');
    expect(phone.value).toBe('');
  });

  it('pesquisa documentos e telefones com ou sem máscara e preserva o DDI', () => {
    for (const query of ['12345678909', '123.456.789-09', '11987652143', '(11) 98765-2143']) {
      expect(matchesPersonalData(query, '12345678909', '11987652143')).toBe(true);
    }
    expect(matchesPersonalData('12345678909', '123.456.789-09')).toBe(true);
    expect(matchesPersonalData('---', '12345678909', '')).toBe(false);
    expect(matchesPersonalData('99888', '12345678909', '11987652143')).toBe(false);
    expect(formatPhone('5511987652143')).toBe('+55 (11) 98765-2143');
  });
});

describe('Limites numéricos', () => {
  it('bloqueia letras e excesso ao digitar e limpa colagens em ambos os campos', async () => {
    TestBed.configureTestingModule({ imports: [MaskTestModule] });
    const fixture = TestBed.createComponent(Form);
    fixture.detectChanges();
    await fixture.whenStable();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    for (const input of inputs) {
      input.setSelectionRange(input.value.length, input.value.length);
      for (const key of ['x', '!', '9']) {
        const event = new KeyboardEvent('keydown', { key, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      }
      input.value = 'abc123456789012345!';
      input.dispatchEvent(new Event('input'));
      expect(input.value.replace(/[^0-9]/g, '')).toBe('12345678901');
    }
    expect(fixture.componentInstance.cpf).toBe('12345678901');
    expect(fixture.componentInstance.phone).toBe('12345678901');
  });
});
