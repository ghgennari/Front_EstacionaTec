import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  ParkingRegistryService,
  HistoryRecord,
} from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  private destroyed = false;
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  stats: string[][] = [];
  vehicles: string[][] = [];
  error = '';
  async ngOnInit(): Promise<void> {
    await this.load();
    if (this.destroyed) return;
    this.timer = setInterval(() => void this.load(), 10000);
  }
  async load(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const data = await this.api.request<{
        parked: number;
        entriesToday: number;
        exitsToday: number;
        vehicles: HistoryRecord[];
      }>('GET', '/dashboard');
      this.stats = [
        ['Veículos Estacionados', String(data.parked)],
        ['Entradas Hoje', String(data.entriesToday)],
        ['Saídas Hoje', String(data.exitsToday)],
      ];
      this.vehicles = data.vehicles.map((v) => [
        v.plate,
        v.owner,
        v.category,
        new Date(v.entry).toLocaleTimeString('pt-BR'),
      ]);
      this.error = '';
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
  ngOnDestroy(): void {
    this.destroyed = true;
    clearInterval(this.timer);
  }
}
