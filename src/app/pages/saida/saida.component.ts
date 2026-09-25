import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
  ParkingRegistryService,
  EntryRecord,
  HistoryRecord,
} from '../../core/services/parking-registry.service';
@Component({ selector: 'app-saida', standalone: false, templateUrl: './saida.component.html' })
export class SaidaComponent implements OnInit {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  plate = '';
  search = '';
  confirmed = '';
  entry: EntryRecord | null = null;
  error = '';
  gateMessage = '';
  busy = false;
  vehicles: Array<HistoryRecord & { entryTime: string }> = [];
  private requestId = crypto.randomUUID();
  get filtered() {
    const text = this.search.trim().toLowerCase();
    const plate = text.replace(/[-\s]/g, '');
    return this.vehicles.filter((v) =>
      (!!plate && v.plate.toLowerCase().replace(/[-\s]/g, '').includes(plate)) ||
      [v.plate, v.owner, v.brand, v.model, v.entryTime]
        .join(' ')
        .toLowerCase()
        .includes(text),
    );
  }
  async ngOnInit(): Promise<void> {
    await this.reload();
  }
  private async reload(): Promise<void> {
    try {
      this.vehicles = (await this.api.request<HistoryRecord[]>('GET', '/movimentacoes/ativos')).map(
        (v) => ({ ...v, entryTime: new Date(v.entry).toLocaleString('pt-BR') }),
      );
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  clearFeedback(): void {
    this.entry = null;
    this.error = '';
    this.gateMessage = '';
    this.requestId = crypto.randomUUID();
  }
  async submit(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.gateMessage = '';
    this.entry = null;
    this.confirmed = '';
    try {
      const result = await this.api.request<EntryRecord>('POST', '/movimentacoes/saida', {
        plate: this.plate,
        requestId: this.requestId,
      });
      this.entry = result;
      this.plate = result.plate;
      this.confirmed = result.plate;
      this.gateMessage = result.warning ?? 'Abertura confirmada pelo ESP32.';
      this.requestId = crypto.randomUUID();
      await this.reload();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
  async exit(plate: string): Promise<void> {
    if (this.busy) return;
    if (this.plate !== plate) this.requestId = crypto.randomUUID();
    this.plate = plate;
    await this.submit();
  }
  async openGate(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const result = await this.api.request<{ message: string }>('POST', '/cancela/abrir-manualmente');
      this.gateMessage = result.message;
    } catch (error) {
      this.gateMessage = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
