import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ParkingRegistryService, Report } from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-relatorios',
  standalone: false,
  templateUrl: './relatorios.component.html',
})
export class RelatoriosComponent implements OnInit {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  start = '';
  end = '';
  type = 'Entradas e Saídas';
  plate = '';
  eventType = '';
  userId: number | null = null;
  recentReports: Report[] = [];
  message = '';
  busy = false;
  async ngOnInit(): Promise<void> {
    try {
      this.recentReports = await this.api.request<Report[]>('GET', '/relatorios');
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  async generate(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.message = '';
    try {
      await this.api.request('POST', '/relatorios', {
        start: this.start,
        end: this.end,
        type: this.type,
        plate: this.plate,
        userId: this.userId,
        eventType: this.eventType,
      });
      this.message = 'Relatório CSV gerado com os dados do banco.';
      await this.ngOnInit();
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
  async download(report: Report): Promise<void> {
    if (!report.available) {
      this.message = 'Este relatório demonstrativo não possui arquivo.';
      return;
    }
    try {
      await this.api.download(
        '/relatorios/' + report.id + '/arquivo',
        'relatorio-' + report.id + '.csv',
      );
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
}
