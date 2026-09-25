import { create, entry } from '../../core/testing/api-test';
import { EntradaComponent } from './entrada.component';
describe('Entrada integrada', () => {
  function setupVisitor() {
    const context = create(EntradaComponent);
    context.fixture.detectChanges();
    const dialog = context.fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    // O ambiente de teste não implementa o comportamento modal do navegador.
    dialog.showModal = () => dialog.setAttribute('open', '');
    dialog.close = () => dialog.removeAttribute('open');
    return { ...context, dialog };
  }

  it('pede responsável e modelo com a placa preenchida e permite cancelar sem cadastrar', async () => {
    const { component, http, fixture, dialog } = setupVisitor();
    component.plate = 'VIS1234';
    const pending = component.submit();
    http.expectOne('/api/movimentacoes/entrada').flush(
      { code: 'VEICULO_NAO_CADASTRADO', message: 'Informe os dados.' },
      { status: 409, statusText: 'Conflict' },
    );
    await pending;
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    const plate = fixture.nativeElement.querySelector('#visitor-plate') as HTMLInputElement;
    expect(plate.value).toBe('VIS1234');
    expect(plate.readOnly).toBe(true);
    expect(component.entry).toBeNull();
    await component.confirmVisitor();
    expect(component.visitorError).toContain('Preencha');
    component.cancelVisitor();
    expect(dialog.open).toBe(false);
    expect(component.plate).toBe('VIS1234');
    http.expectNone('/api/movimentacoes/entrada');
    http.verify();
  });

  it('confirma visitante sem imagem e conserva os dados e identificador após falha de rede', async () => {
    const { component, http, dialog } = setupVisitor();
    component.plate = 'VIS1234';
    const pending = component.submit();
    const initial = http.expectOne('/api/movimentacoes/entrada');
    const requestId = initial.request.body.requestId;
    initial.flush({ code: 'VEICULO_NAO_CADASTRADO' }, { status: 409, statusText: 'Conflict' });
    await pending;
    component.responsibleName = ' Ana Visitante ';
    component.visitorModel = ' Fiat Uno ';
    const first = component.confirmVisitor();
    await component.confirmVisitor();
    component.cancelVisitor();
    expect(dialog.open).toBe(true);
    const failed = http.expectOne('/api/movimentacoes/entrada');
    expect(failed.request.body).toEqual({
      plate: 'VIS1234', requestId,
      visitor: { responsibleName: 'Ana Visitante', model: 'Fiat Uno' },
    });
    failed.error(new ProgressEvent('error'));
    await first;
    expect(component.visitorError).toContain('conectar à API');
    expect(component.responsibleName).toBe(' Ana Visitante ');
    const retry = component.confirmVisitor();
    const request = http.expectOne('/api/movimentacoes/entrada');
    expect(request.request.body.requestId).toBe(requestId);
    request.flush({ ...entry, vehicleId: null, plate: 'VIS-1234', owner: 'Ana Visitante', category: 'Visitante', model: 'Fiat Uno' });
    await retry;
    expect(dialog.open).toBe(false);
    expect(component.entry?.owner).toBe('Ana Visitante');
    expect(component.entry?.vehicleId).toBeNull();
    expect(component.gateMessage).toContain('não conectado');
    http.verify();
  });

  it('não abre cadastro para veículo bloqueado ou entrada duplicada', async () => {
    const { component, http, dialog } = setupVisitor();
    component.plate = 'TST1234';
    const pending = component.submit();
    http.expectOne('/api/movimentacoes/entrada').flush(
      { message: 'Veículo sem autorização ativa.' }, { status: 409, statusText: 'Conflict' },
    );
    await pending;
    expect(dialog.open).toBe(false);
    expect(component.error).toContain('sem autorização');
    http.verify();
  });

  it('registra manualmente sem exibir ou enviar campo de imagem', async () => {
    const { component, http, fixture } = create(EntradaComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Capturar da câmera');
    component.plate = 'TST1234';
    const pending = component.submit();
    const request = http.expectOne('/api/movimentacoes/entrada');
    expect(request.request.body.imageId).toBeUndefined();
    request.flush(entry);
    await pending;
    expect(component.entry?.id).toBe(20);
    http.verify();
  });
  it('mantém o registro e apresenta falha da cancela sem enviar entrada duplicada', async () => {
    const { component, http } = create(EntradaComponent);
    component.plate = 'TST1234';
    const pending = component.submit();
    await component.submit();
    const request = http.expectOne('/api/movimentacoes/entrada');
    expect(request.request.body.imageId).toBeUndefined();
    request.flush(entry);
    await pending;
    expect(component.entry?.id).toBe(20);
    expect(component.gateMessage).toContain('não conectado');
    const gate = component.openGate();
    const command = http.expectOne('/api/cancela/abrir-manualmente');
    expect(command.request.body).toBeNull();
    command.flush({ message: 'ESP32 não conectado' }, { status: 503, statusText: 'Unavailable' });
    await gate;
    expect(component.entry?.id).toBe(20);
    http.verify();
  });
  it('preserva identificador ao repetir requisição que falhou na rede', async () => {
    const { component, http } = create(EntradaComponent);
    component.plate = 'TST1234';
    const first = component.submit();
    const firstRequest = http.expectOne('/api/movimentacoes/entrada');
    const requestId = firstRequest.request.body.requestId;
    firstRequest.error(new ProgressEvent('error'));
    await first;
    const second = component.submit();
    const secondRequest = http.expectOne('/api/movimentacoes/entrada');
    expect(secondRequest.request.body.requestId).toBe(requestId);
    secondRequest.flush(entry);
    await second;
    http.verify();
  });
});
