import { ImagensComponent } from './imagens.component';

describe('ImagensComponent', () => {
  it('combina os filtros de placa, data, tipo e autorização', () => {
    const component = new ImagensComponent();
    component.searchPlate = ' abc ';
    component.dateFilter = '2026-05-07';
    component.accessType = 'Saída';
    component.accessStatus = 'Autorizado';
    expect(component.filtered.map((image) => image.plate)).toEqual(['ABC-1234']);
    component.dateFilter = '2026-05-08';
    expect(component.filtered).toEqual([]);
  });
  it('limita a paginação ao número real de páginas', () => {
    const component = new ImagensComponent();
    component.changePage(1);
    expect(component.page).toBe(1);
    component.changePage(-1);
    expect(component.page).toBe(1);
    expect(component.visibleImages.length).toBe(4);
  });
});
