import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { ParkingRegistryService } from '../../core/services/parking-registry.service';
import { VeiculosComponent } from '../veiculos/veiculos.component';
import { PessoasComponent } from '../pessoas/pessoas.component';
import { EntradaComponent } from './entrada.component';

describe('Registro de entrada', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EntradaComponent],
      providers: [provideRouter([])],
    });
  });

  for (const plate of ['abc-1234', 'abc1234', 'ABC-1234', 'ABC1234']) {
    it('consulta a placa ' + plate + ' e registra proprietário, categoria e horário', () => {
      const component = TestBed.createComponent(EntradaComponent).componentInstance;
      const before = Date.now();
      component.plate = plate;
      component.submit();
      expect(component.entry?.plate).toBe('ABC-1234');
      expect(component.entry?.owner).toBe('Maria Silva');
      expect(component.entry?.category).toBe('Aluno');
      expect(component.entry?.enteredAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(TestBed.inject(ParkingRegistryService).entries.length).toBe(1);
    });
  }

  it('obtém a categoria Professor do cadastro de pessoas', () => {
    const component = TestBed.createComponent(EntradaComponent).componentInstance;
    component.plate = 'xyz5678';
    component.submit();
    expect(component.entry?.category).toBe('Professor');
  });

  it('rejeita placas inválidas, vazias e não cadastradas sem registrar eventos', () => {
    const component = TestBed.createComponent(EntradaComponent).componentInstance;
    for (const plate of ['', 'ab123', 'ABC--1234', 'QQQ1111']) {
      component.plate = plate;
      component.submit();
      expect(component.error).not.toBe('');
      expect(component.entry).toBeNull();
    }
    expect(TestBed.inject(ParkingRegistryService).entries).toEqual([]);
  });

  it('consulta um veículo e proprietário criados nas telas de cadastro', () => {
    const people = TestBed.runInInjectionContext(() => new PessoasComponent());
    people.form = {
      name: 'Pessoa Teste',
      document: '000.000.000-00',
      email: '',
      phone: '',
      type: 'Professor',
    };
    people.save();
    const vehicles = TestBed.runInInjectionContext(() => new VeiculosComponent());
    vehicles.form = {
      plate: 'TST1234',
      model: 'Modelo Teste',
      color: 'Azul',
      owner: 'Pessoa Teste',
      type: 'Carro',
    };
    vehicles.save();
    const component = TestBed.createComponent(EntradaComponent).componentInstance;
    component.plate = 'tst-1234';
    component.submit();
    expect(component.entry?.owner).toBe('Pessoa Teste');
    expect(component.entry?.category).toBe('Professor');
  });

  it('abertura manual não registra entrada nem informa sucesso físico', () => {
    const component = TestBed.createComponent(EntradaComponent).componentInstance;
    component.openGate();
    expect(component.gateMessage).toContain('não está conectado');
    expect(TestBed.inject(ParkingRegistryService).entries).toEqual([]);
  });

  it('envia o formulário e mostra os dados na tela', async () => {
    const fixture = TestBed.createComponent(EntradaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector('input')!;
    input.value = 'abc1234';
    input.dispatchEvent(new Event('input'));
    root
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(root.textContent).toContain('Entrada Autorizada');
    expect(root.textContent).toContain('Maria Silva');
    expect(root.querySelectorAll('input').length).toBe(1);
  });
});
