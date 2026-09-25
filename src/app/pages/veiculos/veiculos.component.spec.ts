import { create, vehicle } from '../../core/testing/api-test';
import { VeiculosComponent } from './veiculos.component';
describe('Veículos integrados', () => {
  it('permite ao porteiro apenas consultar veículos, sem buscar pessoas ou oferecer alterações', async () => {
    const { component, http, fixture } = create(VeiculosComponent, 'Porteiro');
    fixture.detectChanges();
    http.expectOne('/api/veiculos').flush([vehicle]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(vehicle.plate);
    expect(fixture.nativeElement.textContent).not.toContain('Cadastrar Veículo');
    expect(fixture.nativeElement.textContent).not.toContain('Editar');
    expect(fixture.nativeElement.textContent).not.toContain('Excluir');
    http.expectNone('/api/pessoas');
    component.openCreate();
    component.edit(vehicle);
    await component.save();
    component.pendingDelete = vehicle;
    await component.confirmDelete();
    expect(component.modal).toBe(false);
    http.verify();
  });

  it('envia o ID do proprietário e mantém formulário se o servidor rejeita uma placa duplicada', async () => {
    const { component, http } = create(VeiculosComponent);
    component.edit(vehicle);
    const pending = component.save();
    const request = http.expectOne('/api/veiculos/1');
    expect(request.request.body.ownerId).toBe(1);
    request.flush({ message: 'Placa já cadastrada.' }, { status: 409, statusText: 'Conflict' });
    await pending;
    expect(component.modal).toBe(true);
    expect(component.error).toContain('Placa');
    http.verify();
  });
});
