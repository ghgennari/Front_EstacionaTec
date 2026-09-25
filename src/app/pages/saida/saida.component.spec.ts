import { create, entry } from '../../core/testing/api-test';
import { SaidaComponent } from './saida.component';
describe('Saída integrada', () => {
  it('busca placa com ou sem hífen e em qualquer caixa', () => {
    const { component } = create(SaidaComponent);
    component.vehicles = [{ id: 1, plate: 'ABC-1234', owner: 'Ana', model: 'Uno',
      brand: 'Fiat', category: 'Visitante', ownerDocument: null, entry: entry.enteredAt,
      exit: null, entryTime: '10:00' }];
    for (const search of ['ABC-1234', 'ABC1234', 'abc1234', 'abc-1234', ' ABC1234 ', 'ana', 'Fiat']) {
      component.search = search;
      expect(component.filtered.length).toBe(1);
    }
    component.search = 'XYZ9999';
    expect(component.filtered.length).toBe(0);
  });

  it('abre manualmente sem movimentação e mantém o botão antes da lista', async () => {
    const { component, http, fixture } = create(SaidaComponent);
    fixture.detectChanges();
    http.expectOne('/api/movimentacoes/ativos').flush([]);
    const button = fixture.nativeElement.querySelector('button');
    const table = fixture.nativeElement.querySelector('table');
    expect(button.textContent).toContain('Abrir Portão');
    expect(button.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const opening = component.openGate();
    const command = http.expectOne('/api/cancela/abrir-manualmente');
    expect(command.request.body).toBeNull();
    command.flush({ message: 'Abertura manual confirmada. Imagem registrada.' });
    await opening;
    expect(component.entry).toBeNull();
    expect(component.gateMessage).toContain('Imagem registrada');
    http.verify();
  });

  it('lista a visita sem cadastro e registra a saída pela placa', async () => {
    const { component, http, fixture } = create(SaidaComponent);
    fixture.detectChanges();
    http.expectOne('/api/movimentacoes/ativos').flush([{
      id: 30, plate: 'VIS-1234', owner: 'Ana Visitante', ownerDocument: null,
      model: 'Uno', entry: entry.enteredAt, exit: null, category: 'Visitante', brand: null,
    }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.filtered[0].owner).toBe('Ana Visitante');
    const pending = component.exit(component.vehicles[0].plate);
    const request = http.expectOne('/api/movimentacoes/saida');
    expect(request.request.body.plate).toBe('VIS-1234');
    expect(request.request.body.vehicleId).toBeUndefined();
    request.flush({ ...entry, id: 31, vehicleId: null, plate: 'VIS-1234',
      owner: 'Ana Visitante', model: 'Uno', category: 'Visitante', exitedAt: '2026-09-19T11:00:00' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/api/movimentacoes/ativos').flush([]);
    await pending;
    expect(component.confirmed).toBe('VIS-1234');
    expect(component.vehicles).toEqual([]);
    expect(component.entry?.vehicleId).toBeNull();
    http.verify();
  });

  it('só atualiza a lista após confirmação do servidor', async () => {
    const { component, http, fixture } = create(SaidaComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Capturar da câmera');
    http.expectOne('/api/movimentacoes/ativos').flush([]);
    const pending = component.exit('TST1234');
    const request = http.expectOne('/api/movimentacoes/saida');
    expect(request.request.body.imageId).toBeUndefined();
    expect(component.confirmed).toBe('');
    request.flush({ ...entry, exitedAt: '2026-09-19T11:00:00' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne('/api/movimentacoes/ativos').flush([]);
    await pending;
    expect(component.confirmed).toBe('TST-1234');
    expect(component.vehicles).toEqual([]);
    http.verify();
  });
});
