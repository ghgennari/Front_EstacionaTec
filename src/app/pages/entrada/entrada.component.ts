import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ParkingRegistryService, EntryRecord } from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-entrada',
  standalone: false,
  templateUrl: './entrada.component.html',
  styleUrl: './entrada.component.css',
})
export class EntradaComponent {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  plate = '';
  entry: EntryRecord | null = null;
  error = '';
  gateMessage = '';
  busy = false;
  visitorOpen = false;
  visitorPlate = '';
  responsibleName = '';
  visitorModel = '';
  visitorError = '';
  @ViewChild('visitorDialog', { static: true }) private visitorDialog?: ElementRef<HTMLDialogElement>;
  private requestId = crypto.randomUUID();
  clearFeedback(): void {
    this.entry = null;
    this.error = '';
    this.gateMessage = '';
    this.requestId = crypto.randomUUID();
  }
  async submit(): Promise<void> {
    if (this.busy || this.visitorOpen) return;
    await this.register();
  }

  async confirmVisitor(): Promise<void> {
    if (this.busy || !this.visitorOpen) return;
    const responsibleName = this.responsibleName.trim();
    const model = this.visitorModel.trim();
    if (!responsibleName || !model || responsibleName.length > 150 || model.length > 50) {
      this.visitorError = 'Preencha o responsável (até 150 caracteres) e o modelo (até 50 caracteres).';
      return;
    }
    await this.register({ responsibleName, model });
  }

  cancelVisitor(event?: Event): void {
    event?.preventDefault();
    if (this.busy) return;
    this.closeVisitor();
    this.requestId = crypto.randomUUID();
  }

  private closeVisitor(): void {
    this.visitorOpen = false;
    this.visitorError = '';
    this.responsibleName = '';
    this.visitorModel = '';
    this.visitorDialog?.nativeElement.close();
  }

  private async register(visitor?: { responsibleName: string; model: string }): Promise<void> {
    this.busy = true;
    this.error = '';
    this.visitorError = '';
    this.gateMessage = '';
    this.entry = null;
    try {
      const result = await this.api.request<EntryRecord>('POST', '/movimentacoes/entrada', {
        plate: visitor ? this.visitorPlate : this.plate,
        requestId: this.requestId,
        ...(visitor ? { visitor } : {}),
      });
      this.entry = result;
      this.plate = result.plate;
      this.gateMessage = result.warning ?? 'Abertura confirmada pelo ESP32.';
      this.requestId = crypto.randomUUID();
      if (this.visitorOpen) this.closeVisitor();
    } catch (error) {
      if (!visitor && error instanceof HttpErrorResponse && error.status === 409
          && error.error?.code === 'VEICULO_NAO_CADASTRADO') {
        this.visitorPlate = this.plate.trim().toUpperCase();
        this.responsibleName = '';
        this.visitorModel = '';
        this.visitorOpen = true;
      } else if (visitor) {
        this.visitorError = this.api.error(error);
      } else {
        this.error = this.api.error(error);
      }
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
      const dialog = this.visitorDialog?.nativeElement;
      if (this.visitorOpen && dialog && !dialog.open) {
        this.cdr.detectChanges();
        dialog.showModal();
      }
    }
  }
  async openGate(): Promise<void> {
    if (this.busy || this.visitorOpen) return;

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
