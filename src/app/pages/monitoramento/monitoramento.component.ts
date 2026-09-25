import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import {
  ParkingRegistryService,
  CapturedImage,
} from '../../core/services/parking-registry.service';

@Component({
  selector: 'app-monitoramento',
  standalone: false,
  templateUrl: './monitoramento.component.html',
  styleUrl: './monitoramento.component.css',
})
export class MonitoramentoComponent implements OnInit, OnDestroy {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('webcamVideo', { static: true }) webcamVideo!: ElementRef<HTMLVideoElement>;
  currentTime = new Date();
  refreshing = false;
  connecting = false;
  capturing = false;
  source: 'WEBCAM' | 'IP' | null = null;
  stream: MediaStream | null = null;
  message = '';
  previewUrl = '';
  private destroyed = false;
  private generation = 0;
  private timer?: ReturnType<typeof setInterval>;
  private previewTimer?: ReturnType<typeof setTimeout>;
  private previewGeneration = 0;
  private previewLoading = false;
  private readonly clock = setInterval(() => {
    this.currentTime = new Date();
    this.cdr.markForCheck();
  }, 1000);

  async ngOnInit(): Promise<void> {
    await this.refresh();
    if (!this.destroyed) this.timer = setInterval(() => void this.refresh(), 10000);
  }

  async refresh(): Promise<void> {
    if (this.refreshing || this.destroyed) return;
    this.refreshing = true;
    try {
      const status = await this.api.request<{ source: 'WEBCAM' | 'IP'; message: string }>(
        'GET', '/camera/status',
      );
      if (this.destroyed) return;
      if (this.source !== status.source) {
        this.stopWebcam();
        this.previewGeneration++;
        clearTimeout(this.previewTimer);
        this.clearPreview();
        this.source = status.source;
        this.message = status.message;
      }
      if (this.source === 'IP' && !this.previewLoading) {
        clearTimeout(this.previewTimer);
        void this.updatePreview();
      }
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.refreshing = false;
      this.cdr.markForCheck();
    }
  }

  private async updatePreview(): Promise<void> {
    if (this.destroyed || this.source !== 'IP' || this.previewLoading) return;
    this.previewLoading = true;
    const generation = this.previewGeneration;
    let delay = 200;
    try {
      const frame = await this.api.blob('/camera/preview');
      if (this.destroyed || generation !== this.previewGeneration) return;
      this.clearPreview();
      this.previewUrl = URL.createObjectURL(frame);
      this.message = '';
    } catch {
      if (this.destroyed || generation !== this.previewGeneration) return;
      this.clearPreview();
      this.message = 'Sem imagem da câmera IP. Verifique a conexão com a câmera e o back-end. Tentando reconectar...';
      delay = 3000;
    } finally {
      this.previewLoading = false;
      if (!this.destroyed && this.source === 'IP' && generation === this.previewGeneration) {
        this.previewTimer = setTimeout(() => void this.updatePreview(), delay);
      }
      this.cdr.markForCheck();
    }
  }

  async startWebcam(): Promise<void> {
    if (this.connecting || this.stream || this.destroyed || this.source !== 'WEBCAM') return;
    const generation = ++this.generation;
    this.connecting = true;
    this.message = 'Aguardando permissão para acessar a webcam...';
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('A webcam precisa de localhost ou HTTPS e de um navegador compatível.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (this.destroyed || generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (this.stream === stream) {
            this.stopWebcam();
            this.message = 'A webcam foi desconectada. Ative novamente para continuar.';
            this.cdr.markForCheck();
          }
        };
      });
      const video = this.webcamVideo.nativeElement;
      video.srcObject = stream;
      await video.play();
      if (this.destroyed || generation !== this.generation) return;
      this.clearPreview();
      this.message = 'Webcam ativa. Use Capturar Imagem para salvar uma foto.';
    } catch (error) {
      if (this.destroyed || generation !== this.generation) return;
      this.stopWebcam();
      const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
      this.message =
        name === 'NotAllowedError'
          ? 'Acesso à webcam negado. Permita a câmera nas configurações do navegador.'
          : name === 'NotFoundError'
            ? 'Nenhuma webcam encontrada neste computador.'
            : name === 'NotReadableError'
              ? 'Não foi possível abrir a webcam. Verifique se outro aplicativo está usando a câmera.'
              : this.api.error(error);
    } finally {
      if (generation === this.generation) this.connecting = false;
      this.cdr.markForCheck();
    }
  }

  stopWebcam(): void {
    this.generation++;
    this.connecting = false;
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    this.stream = null;
    if (this.webcamVideo) this.webcamVideo.nativeElement.srcObject = null;
    this.message = 'Webcam desligada.';
    this.cdr.markForCheck();
  }

  private async webcamFrame(): Promise<Blob> {
    const video = this.webcamVideo.nativeElement;
    if (!this.stream || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      throw new Error('Ative a webcam e aguarde a imagem aparecer antes de capturar.');
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1920 / video.videoWidth, 1080 / video.videoHeight);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('O navegador não conseguiu preparar a foto.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível capturar a foto.'))),
        'image/jpeg',
        0.9,
      ),
    );
  }

  async capture(): Promise<void> {
    if (this.capturing || this.destroyed) return;
    this.capturing = true;
    try {
      let image: CapturedImage;
      if (this.source === 'WEBCAM') {
        const frame = await this.webcamFrame();
        if (this.destroyed) return;
        const form = new FormData();
        form.append('file', frame, 'webcam.jpg');
        image = await this.api.request<CapturedImage>('POST', '/camera/webcam/capturar', form);
      } else if (this.source === 'IP') {
        image = await this.api.request<CapturedImage>('POST', '/camera/capturar');
      } else {
        throw new Error('Aguarde a configuração da câmera carregar.');
      }
      if (this.destroyed) return;
      // O vídeo local continua em execução; a imagem já pode ser consultada na galeria.
      this.message = 'Imagem capturada e armazenada. Consulte Imagens Capturadas.';
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.capturing = false;
      this.cdr.markForCheck();
    }
  }

  private clearPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
  }

  async fullscreen(panel: HTMLElement): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panel.requestFullscreen();
    } catch {
      this.message = 'O navegador não permitiu ativar a tela cheia.';
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopWebcam();
    clearInterval(this.clock);
    clearInterval(this.timer);
    this.previewGeneration++;
    clearTimeout(this.previewTimer);
    this.clearPreview();
  }
}
