import { create, image } from '../../core/testing/api-test';
import { ImagensComponent } from './imagens.component';
describe('Imagens integradas', () => {
  it('carrega e combina filtros sem exigir placa em uma captura pendente', async () => {
    const { component, http } = create(ImagensComponent);
    const load = component.ngOnInit();
    http
      .expectOne('/api/imagens')
      .flush([image, { ...image, id: 11, plate: 'TST-1234', type: 'Saída', status: 'Autorizado' }]);
    await load;
    component.searchPlate = 'tst';
    component.accessType = 'Saída';
    expect(component.filtered.length).toBe(1);
    component.dateFilter = '2026-09-20';
    expect(component.filtered).toEqual([]);
    http.verify();
  });
  it('não tenta baixar uma referência sem arquivo real', async () => {
    const { component, http } = create(ImagensComponent);
    await component.download({ ...image, available: false });
    expect(component.message).toContain('não possui arquivo');
    http.expectNone('/api/imagens/10/arquivo');
    http.verify();
  });
});
