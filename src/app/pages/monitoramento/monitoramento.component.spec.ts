import { create, image } from '../../core/testing/api-test';
import { MonitoramentoComponent } from './monitoramento.component';

describe('Monitoramento com webcam e câmera IP', () => {
  it('mostra a imagem IP sem consultar ou exibir eventos recentes', async () => {
    const { component, fixture, http } = create(MonitoramentoComponent);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:camera');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    fixture.detectChanges();
    http.expectOne('/api/camera/status').flush({ source: 'IP', message: 'Conectando' });
    const frame = await vi.waitFor(() => http.expectOne('/api/camera/preview'));
    expect(frame.request.method).toBe('GET');
    frame.flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    await vi.waitFor(() => expect(component.previewUrl).toBe('blob:camera'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Imagem ao vivo da câmera IP');
    expect(fixture.nativeElement.textContent).not.toContain('Eventos Recentes');
    http.expectNone('/api/monitoramento/eventos');
    http.expectNone('/api/camera/capturar');
    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith('blob:camera');
    http.verify();
  });

  it('descarta a imagem que chega após sair da tela', async () => {
    const { component, fixture, http } = create(MonitoramentoComponent);
    const objectUrl = vi.spyOn(URL, 'createObjectURL');
    fixture.detectChanges();
    http.expectOne('/api/camera/status').flush({ source: 'IP', message: 'Conectando' });
    const frame = await vi.waitFor(() => http.expectOne('/api/camera/preview'));
    fixture.destroy();
    frame.flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.previewUrl).toBe('');
    expect(objectUrl).not.toHaveBeenCalled();
    http.verify();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function webcam() {
    const context = create(MonitoramentoComponent);
    vi.spyOn(context.component, 'refresh').mockResolvedValue();
    context.component.source = 'WEBCAM';
    context.fixture.detectChanges();
    const video = context.fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    vi.spyOn(video, 'play').mockResolvedValue();
    const track = { stop: vi.fn(), onended: null as (() => void) | null };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    return { ...context, video, track, stream, getUserMedia };
  }

  it('preserva a falha da captura IP', async () => {
    const { component, http, fixture } = create(MonitoramentoComponent);
    component.source = 'IP';
    const pending = component.capture();
    http
      .expectOne('/api/camera/capturar')
      .flush({ message: 'Câmera não conectada.' }, { status: 503, statusText: 'Unavailable' });
    await pending;
    expect(component.message).toContain('não conectada');
    fixture.destroy();
    http.verify();
  });

  it('abre vídeo sem áudio e libera a webcam quando sai da tela', async () => {
    const { component, fixture, video, track, stream, getUserMedia, http } = webcam();
    await component.startWebcam();
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
    expect(video.srcObject).toBe(stream);
    fixture.destroy();
    expect(track.stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
    http.verify();
  });

  it('informa permissão negada e permite nova tentativa', async () => {
    const { component, fixture, getUserMedia, http } = webcam();
    getUserMedia.mockRejectedValue(new DOMException('Negado', 'NotAllowedError'));
    await component.startWebcam();
    expect(component.message).toContain('Acesso à webcam negado');
    expect(component.stream).toBeNull();
    expect(component.connecting).toBe(false);
    fixture.destroy();
    http.verify();
  });

  it('libera a câmera se a permissão chegar após fechar a tela', async () => {
    const { component, fixture, getUserMedia, stream, track, http } = webcam();
    let resolve!: (stream: MediaStream) => void;
    getUserMedia.mockReturnValue(
      new Promise<MediaStream>((done) => {
        resolve = done;
      }),
    );
    const pending = component.startWebcam();
    fixture.destroy();
    resolve(stream);
    await pending;
    expect(component.stream).toBeNull();
    expect(track.stop).toHaveBeenCalledOnce();
    http.verify();
  });

  it('captura o quadro visível e envia multipart para a API sem interromper o vídeo', async () => {
    const { component, fixture, video, http } = webcam();
    await component.startWebcam();
    Object.defineProperties(video, {
      videoWidth: { value: 640 },
      videoHeight: { value: 480 },
      readyState: { value: 2 },
    });
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
      callback(new Blob(['jpeg'], { type: 'image/jpeg' })),
    );
    const pending = component.capture();
    const request = await vi.waitFor(() => http.expectOne('/api/camera/webcam/capturar'));
    http.expectNone('/api/camera/capturar');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('file').name).toBe('webcam.jpg');
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
    request.flush(image);
    await pending;
    expect(component.message).toContain('Imagem capturada e armazenada');
    expect(component.stream).not.toBeNull();
    fixture.destroy();
    http.verify();
  });

  it('não envia foto antes de existir um quadro válido', async () => {
    const { component, fixture, http } = webcam();
    await component.startWebcam();
    await component.capture();
    expect(component.message).toContain('aguarde a imagem');
    http.expectNone('/api/camera/webcam/capturar');
    fixture.destroy();
    http.verify();
  });
});
