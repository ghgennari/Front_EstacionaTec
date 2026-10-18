import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DisplayFormatDirective, PlateFormatPipe, formatPlate } from './display-format';
import { create, person, vehicle, image } from '../testing/api-test';
import { VeiculosComponent } from '../../pages/veiculos/veiculos.component';
import { ImagensComponent } from '../../pages/imagens/imagens.component';

@Component({ imports: [FormsModule, DisplayFormatDirective], template: '<input appDisplayFormat="title" [(ngModel)]="name"><input appDisplayFormat="plate" [(ngModel)]="plate"><input [(ngModel)]="email">' })
class Form { name = 'MARIA sILVA'; plate = 'abc1234'; email = 'Teste@exemplo.com'; }

describe('Apresentação padronizada', () => {
  it('formata palavras sem alterar identificadores e preserva placas clássicas e Mercosul', async () => {
    const fixture=TestBed.createComponent(Form);
    fixture.detectChanges(); await fixture.whenStable();
    const [name, plate, email]=Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(name.value).toBe('Maria Silva');
    expect(fixture.componentInstance.name).toBe('MARIA sILVA');
    expect(email.value).toBe('Teste@exemplo.com');
    for(const value of ['CIVIC','civic','Civic','CIvic']) {
      name.value=value; name.dispatchEvent(new Event('input')); expect(name.value).toBe('Civic');
    }
    name.value='JOÃO sILVA'; name.dispatchEvent(new Event('input')); expect(name.value).toBe('João Silva');
    expect(plate.value).toBe('ABC-1234');
    plate.value='abc1d23'; plate.dispatchEvent(new Event('input'));
    expect(plate.value).toBe('ABC1D23'); expect(fixture.componentInstance.plate).toBe('ABC1D23');
    plate.value='abc1234'; plate.dispatchEvent(new Event('input'));
    expect(plate.value).toBe('ABC-1234'); expect(fixture.componentInstance.plate).toBe('ABC1234');
    expect(formatPlate('abc-1234')).toBe('ABC-1234');
    expect(new PlateFormatPipe().transform(null)).toBe('');
  });

  it('mostra proprietário e placa em negrito, modelo com inicial maiúscula e máscara no formulário', async () => {
    const {component, fixture, http}=create(VeiculosComponent);
    fixture.detectChanges();
    http.expectOne('/api/pessoas').flush([{...person,name:'MARIA sILVA',document:'12345678909'}]);
    http.expectOne('/api/veiculos').flush([{...vehicle,plate:'abc1234',owner:'MARIA sILVA',model:'CIVIC',color:'pRETO'}]);
    await new Promise(resolve=>setTimeout(resolve,0)); fixture.detectChanges();
    const bold=Array.from(fixture.nativeElement.querySelectorAll('tbody strong')).map((el:any)=>el.textContent);
    expect(bold).toContain('ABC-1234'); expect(bold).toContain('Maria Silva');
    expect(fixture.nativeElement.textContent).toContain('Civic');
    expect(fixture.nativeElement.textContent).toContain('Preto');
    component.search='ABC-1234'; expect(component.filtered.length).toBe(1);
    component.search='abc1234'; expect(component.filtered.length).toBe(1);
    fixture.nativeElement.querySelector('[aria-label^="Editar veículo"]').click(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="plate"]').value).toBe('ABC-1234');
    expect(fixture.nativeElement.querySelector('input[name="model"]').value).toBe('Civic');
    expect(fixture.nativeElement.querySelector('select[name="ownerId"]').textContent).toContain('Maria Silva — 123.456.789-09');
    http.verify();
  });

  it('busca imagens por placa com e sem máscara', () => {
    const { component, http }=create(ImagensComponent);
    component.images=[{...image,plate:'ABC-1234'}];
    for(const query of ['abc1234','ABC-1234']) { component.searchPlate=query; expect(component.filtered.length).toBe(1); }
    http.verify();
  });
});
