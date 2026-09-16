import { TestBed } from '@angular/core/testing';
import { VeiculosComponent } from './veiculos.component';

describe('Ações de veículos', () => {
  function create() {
    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(() => new VeiculosComponent());
  }

  it('obtém a categoria pelo proprietário', () => {
    const component = create();
    expect(component.vehicles.map(vehicle => component.category(vehicle))).toEqual([
      'Aluno', 'Professor', 'Funcionário',
    ]);
  });

  it('edita sem duplicar o veículo ou mudar seu ID', () => {
    const component = create();
    const vehicle = component.vehicles[0];
    component.edit(vehicle);
    component.form.model = 'Novo modelo';
    component.save();
    expect(component.vehicles.length).toBe(3);
    expect(component.vehicles[0].id).toBe(vehicle.id);
    expect(component.vehicles[0].model).toBe('Novo modelo');
  });

  it('cancelar descarta alterações do formulário', () => {
    const component = create();
    component.edit(component.vehicles[0]);
    component.form.model = 'Alteração cancelada';
    component.closeModal();
    expect(component.vehicles[0].model).toBe('Honda Civic');
    expect(component.editingId).toBeNull();
  });

  it('exclui somente após confirmação e apenas o veículo escolhido', () => {
    const component = create();
    component.pendingDelete = component.vehicles[1];
    expect(component.vehicles.length).toBe(3);
    component.confirmDelete();
    expect(component.vehicles.map(vehicle => vehicle.id)).toEqual([1, 3]);
    expect(component.pendingDelete).toBeNull();
  });
});
