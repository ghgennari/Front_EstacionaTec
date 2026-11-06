import { TestBed } from '@angular/core/testing';
import { create, person, vehicle } from '../../core/testing/api-test';
import { ParkingRegistryService } from '../../core/services/parking-registry.service';
import { VeiculosComponent } from './veiculos.component';

describe('Veículo compartilhado', () => {
  it('adiciona seleção pelo botão + e remove sem enviar o formulário', async () => {
    const {component, fixture, http} = create(VeiculosComponent);
    fixture.detectChanges();
    http.expectOne('/api/pessoas').flush([person, {...person, id: 2, name: 'Segunda Pessoa'}]);
    http.expectOne('/api/veiculos').flush([vehicle]);
    await new Promise(resolve => setTimeout(resolve, 0));
    component.edit(vehicle); fixture.detectChanges();
    const button = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => b.textContent.includes('Adicionar proprietário')) as HTMLButtonElement;
    button.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select[aria-label="Proprietário 2"]')).toBeTruthy();
    expect(component.form.additionalOwnerIds).toEqual([null]);
    fixture.nativeElement.querySelector('[aria-label="Remover proprietário 2"]').click();
    expect(component.form.additionalOwnerIds).toEqual([]); http.verify();
  });
  it('preserva todos os IDs ao editar e permite retirar um vínculo', async () => {
    const {component, http} = create(VeiculosComponent);
    component.edit({...vehicle, ownerIds: [1, 2, 3]});
    expect(component.form.additionalOwnerIds).toEqual([2, 3]);
    component.form.additionalOwnerIds.splice(0, 1);
    const pending = component.save();
    const request = http.expectOne('/api/veiculos/1');
    expect(request.request.body.ownerIds).toEqual([1, 3]);
    request.flush({message: 'Falha simulada'}, {status: 409, statusText: 'Conflict'});
    await pending; expect(component.modal).toBe(true); http.verify();
  });
  it('bloqueia pessoa repetida e campo adicional sem seleção', async () => {
    const {component, http} = create(VeiculosComponent);
    component.edit(vehicle);
    component.form.additionalOwnerIds = [1]; await component.save();
    expect(component.error).toContain('diferente');
    component.form.additionalOwnerIds = [null]; await component.save();
    expect(component.error).toContain('campo vazio');
    http.expectNone('/api/veiculos/1'); http.verify();
  });
  it('sincroniza alteração da segunda pessoa sem apagar o primeiro nome', async () => {
    const {http} = create(VeiculosComponent);
    const api = TestBed.inject(ParkingRegistryService);
    const pending = api.loadRegistry();
    http.expectOne('/api/pessoas').flush([person, {...person, id: 2}]);
    http.expectOne('/api/veiculos').flush([{...vehicle, ownerIds: [1, 2], owners: [
      {id: 1, name: 'Primeira Pessoa', category: 'Aluno', active: true},
      {id: 2, name: 'Segunda Pessoa', category: 'Aluno', active: true}]}]);
    await pending;
    api.syncPerson({...person, id: 2, name: 'Nome Alterado', type: 'Professor'});
    expect(api.vehicles[0].owner).toBe('Primeira Pessoa / Nome Alterado');
    expect(api.vehicles[0].category).toBe('Aluno / Professor'); http.verify();
  });
});
