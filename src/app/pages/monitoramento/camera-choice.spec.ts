import { create } from '../../core/testing/api-test';
import { MonitoramentoComponent } from './monitoramento.component';
import { vi } from 'vitest';

describe('Escolha administrativa da camera', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function setup(role = 'Administrador') {
    const context = create(MonitoramentoComponent, role);
    vi.spyOn(context.component, 'refresh').mockResolvedValue();
    context.fixture.detectChanges();
    const video = context.fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    vi.spyOn(video, 'play').mockResolvedValue();
    const track = { stop: vi.fn(), onended: null as (() => void) | null };
    const stream = { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    Object.defineProperties(video, {
      videoWidth: { value: 1280 }, videoHeight: { value: 720 }, readyState: { value: 2 },
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['jpeg'], { type: 'image/jpeg' })));
    return { ...context, getUserMedia, track };
  }

  it('exibe escolha somente para administrador e bloqueia chamada direta pelo porteiro', async () => {
    const { component, fixture, http, getUserMedia } = setup('Porteiro');
    expect(fixture.nativeElement.querySelector('#camera-source')).toBeNull();
    await component.selectSource('WEBCAM');
    expect(getUserMedia).not.toHaveBeenCalled();
    fixture.destroy();
    http.verify();
  });

  it('ativa webcam local e libera o dispositivo ao voltar para IP', async () => {
    const { component, fixture, http, track, getUserMedia } = setup();
    expect(fixture.nativeElement.querySelector('#camera-source')).not.toBeNull();
    await component.selectSource('WEBCAM');
    expect(component.source).toBe('WEBCAM');
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
    await component.selectSource('IP');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(component.stream).toBeNull();
    const preview = http.expectOne('/api/camera/preview');
    fixture.destroy();
    preview.flush(new Blob(['jpeg']));
    http.verify();
  });

  it('envia quadros para OCR local sem sobreposicao e ignora resposta depois de desligar', async () => {
    vi.useFakeTimers();
    const { component, fixture, http } = setup();
    await component.selectSource('WEBCAM');
    await vi.advanceTimersByTimeAsync(1500);
    const request = http.expectOne('/api/camera/local/ocr');
    expect(request.request.body.get('file').name).toBe('webcam.jpg');
    expect(request.request.body.get('session')).toMatch(/^[a-f0-9-]{36}$/);
    await vi.advanceTimersByTimeAsync(4500);
    http.expectNone('/api/camera/local/ocr');
    http.expectNone('/api/camera/ocr/acompanhar');
    component.stopWebcam();
    request.flush({ status: 'ENTRADA_REGISTRADA', plate: 'ABC1234' });
    await vi.advanceTimersByTimeAsync(2000);
    expect(component.ocrState).toBeNull();
    http.expectNone('/api/camera/local/ocr');
    fixture.destroy();
    http.verify();
  });

  it('atualizacao do servidor nao desfaz a escolha local', async () => {
    const { component, fixture, http } = setup();
    await component.selectSource('WEBCAM');
    vi.mocked(component.refresh).mockRestore();
    const pending = component.refresh();
    http.expectOne('/api/camera/status').flush({ source: 'IP', message: 'Camera IP' });
    await pending;
    expect(component.source).toBe('WEBCAM');
    expect(component.stream).not.toBeNull();
    http.expectNone('/api/camera/preview');
    fixture.destroy();
    http.verify();
  });
});