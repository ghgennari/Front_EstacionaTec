import { Component, inject } from '@angular/core';
import { EntryRecord, ParkingRegistryService } from '../../core/services/parking-registry.service';

@Component({
  selector: 'app-entrada',
  standalone: false,
  templateUrl: './entrada.component.html',
  styleUrl: './entrada.component.css',
})
export class EntradaComponent {
  private readonly registry = inject(ParkingRegistryService);
  plate = '';
  entry: EntryRecord | null = null;
  error = '';
  gateMessage = '';

  clearFeedback(): void {
    this.entry = null;
    this.error = '';
  }

  submit(): void {
    this.clearFeedback();
    this.gateMessage = '';
    try {
      this.entry = this.registry.registerEntry(this.plate);
      this.plate = this.entry.plate;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Não foi possível registrar a entrada.';
    }
  }

  openGate(): void {
    this.gateMessage =
      'Abertura manual indisponível: o portão ainda não está conectado ao sistema.';
  }
}
