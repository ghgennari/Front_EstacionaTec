import { create } from '../../core/testing/api-test';
import { MonitoramentoComponent } from './monitoramento.component';
import { vi } from 'vitest';

describe('Previa economica e diagnostico OCR', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('limita a previa a um quadro por segundo e pausa downloads em aba oculta', async () => {
    vi.useFakeTimers();
    const { fixture, component, http } = create(MonitoramentoComponent);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:teste');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fixture.detectChanges();
    http.expectOne('/api/camera/status').flush({ source: 'IP', message: '' });
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('/api/camera/preview').flush(new Blob(['jpeg']));
    await vi.advanceTimersByTimeAsync(999);
    http.expectNone('/api/camera/preview');
    await vi.advanceTimersByTimeAsync(1);
    http.expectOne('/api/camera/preview').flush(new Blob(['jpeg']));
    hidden.mockReturnValue(true);
    await vi.advanceTimersByTimeAsync(5000);
    http.expectNone('/api/camera/preview');
    hidden.mockReturnValue(false);
    await vi.advanceTimersByTimeAsync(1000);
    http.expectOne('/api/camera/preview').flush(new Blob(['jpeg']));
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(3000);
    http.expectNone('/api/camera/preview');
    http.verify();
  });

  it('exibe placa, confianca e tempo retornados pelo teste do quadro atual', async () => {
    const { fixture, component, http } = create(MonitoramentoComponent);
    const pending = component.diagnoseOcr();
    http.expectOne('/api/camera/ocr/diagnosticar').flush({ message: 'ABC1234 (94%)', elapsedMs: 350 });
    await pending;
    expect(component.diagnosticMessage).toContain('ABC1234 (94%)');
    expect(component.diagnosticMessage).toContain('350 ms');
    expect(component.diagnosing).toBe(false);
    http.expectNone('/api/movimentacoes/entrada');
    fixture.destroy();
    http.verify();
  });
});