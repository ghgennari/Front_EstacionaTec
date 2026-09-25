import { create } from '../../core/testing/api-test';
import { HistoricoComponent } from './historico.component';
describe('Histórico integrado', () => {
  async function setupOwner(document: string | null) {
    const context = create(HistoricoComponent);
    context.fixture.detectChanges();
    context.http.expectOne('/api/historico').flush([{
      id: 1, plate: 'TST-1234', owner: 'Ana', ownerDocument: document, model: 'Uno',
      category: document ? 'Aluno' : 'Visitante', brand: null,
      entry: '2026-09-19T10:00:00', exit: '2026-09-19T11:30:00',
    }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    context.fixture.detectChanges();
    const dialog = context.fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
    return { ...context, dialog };
  }

  it('abre o proprietário em popup e mostra contato sem link para pessoas', async () => {
    const { component, fixture, http, dialog } = await setupOwner('123.456');
    fixture.nativeElement.querySelector('tbody button').click();
    expect(dialog.open).toBe(true);
    http.expectOne('/api/pessoas').flush([{
      id: 2, name: 'Ana Atualizada', document: '123456', email: 'ana@example.com',
      phone: '11999999999', type: 'Aluno',
    }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(dialog.textContent).toContain('Ana');
    expect(dialog.textContent).toContain('ana@example.com');
    expect(dialog.textContent).toContain('11999999999');
    expect(fixture.nativeElement.querySelector('a[href="/pessoas"]')).toBeNull();
    dialog.querySelector('button')!.click();
    expect(dialog.open).toBe(false);
    expect(component.selectedRecord).toBeNull();
    http.verify();
  });

  it('mostra visitante sem cadastro e fecha com Escape', async () => {
    const { component, fixture, http, dialog } = await setupOwner(null);
    fixture.nativeElement.querySelector('tbody button').click();
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('Ana');
    expect(dialog.textContent).toContain('Visitante');
    expect(dialog.textContent).toContain('TST-1234');
    http.expectNone('/api/pessoas');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(false);
    expect(component.selectedRecord).toBeNull();
    http.verify();
  });

  it('mostra estadias encerradas e calcula permanência com dados da API', async () => {
    const { component, http } = create(HistoricoComponent);
    const load = component.ngOnInit();
    http.expectOne('/api/historico').flush([
      {
        id: 1,
        plate: 'TST-1234',
        owner: 'Teste',
        ownerDocument: '123',
        model: 'Teste',
        entry: '2026-09-19T10:00:00',
        exit: '2026-09-19T11:30:00',
      },
      { id: 2, plate: 'TST-9999', owner: 'Outro', entry: '2026-09-19T10:00:00', exit: null },
    ]);
    await load;
    expect(component.filtered.length).toBe(1);
    expect(component.duration(component.filtered[0])).toBe('1h 30min');
    http.verify();
  });
});
