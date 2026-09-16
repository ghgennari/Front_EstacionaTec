import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';

@Component({
  selector: 'app-monitoramento',
  standalone: false,
  templateUrl: './monitoramento.component.html',
  styleUrl: './monitoramento.component.css',
})
export class MonitoramentoComponent implements OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  currentTime = new Date();
  refreshing = false;
  message = '';
  selectedEvent: (typeof this.recentEvents)[number] | null = null;
  readonly recentEvents = [
    { plate: 'ABC-1234', time: '14:35:22', status: 'Autorizado', owner: 'Maria Silva' },
    { plate: 'XYZ-5678', time: '14:32:15', status: 'Autorizado', owner: 'Prof. Carlos Santos' },
    { plate: 'XXX-0000', time: '14:28:43', status: 'Negado', owner: 'Desconhecido' },
    { plate: 'DEF-9012', time: '14:25:10', status: 'Autorizado', owner: 'Ana Paula' },
    { plate: 'GHI-3456', time: '14:20:55', status: 'Autorizado', owner: 'Roberto Lima' },
  ];
  private readonly clock = setInterval(() => {
    this.currentTime = new Date();
    this.changeDetector.markForCheck();
  }, 1000);
  private refreshTimer?: ReturnType<typeof setTimeout>;

  refresh(): void {
    this.refreshing = true;
    this.message = '';
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      this.refreshing = false;
      this.message = 'Visualização atualizada. A câmera ainda não está conectada.';
      this.changeDetector.markForCheck();
    }, 1500);
  }

  capture(): void {
    this.message = 'Captura indisponível: conecte uma câmera para obter uma imagem real.';
  }

  async fullscreen(panel: HTMLElement): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panel.requestFullscreen();
    } catch {
      this.message = 'O navegador não permitiu ativar a tela cheia.';
      this.changeDetector.markForCheck();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.clock);
    clearTimeout(this.refreshTimer);
  }
}
