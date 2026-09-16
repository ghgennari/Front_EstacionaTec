import { Component, inject } from '@angular/core';
import {
  ParkingRegistryService,
  RegisteredVehicle,
} from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-veiculos',
  standalone: false,
  templateUrl: './veiculos.component.html',
})
export class VeiculosComponent {
  private readonly registry = inject(ParkingRegistryService);
  search = '';
  modal = false;
  editingId: number | null = null;
  pendingDelete: RegisteredVehicle | null = null;
  form = { plate: '', model: '', color: '', owner: '', type: 'Carro' };
  get vehicles(): RegisteredVehicle[] {
    return this.registry.vehicles;
  }
  set vehicles(value: RegisteredVehicle[]) {
    this.registry.vehicles = value;
  }
  get filtered() {
    return this.vehicles.filter((v) =>
      Object.values(v).join(' ').toLowerCase().includes(this.search.toLowerCase()),
    );
  }
  category(vehicle: RegisteredVehicle): string {
    return (
      this.registry.people.find(
        (person) =>
          person.name.trim().toLocaleLowerCase('pt-BR') ===
          vehicle.owner.trim().toLocaleLowerCase('pt-BR'),
      )?.type ?? 'Não identificado'
    );
  }

  openCreate(): void {
    this.closeModal();
    this.modal = true;
  }

  edit(vehicle: RegisteredVehicle): void {
    this.editingId = vehicle.id;
    const { id, ...data } = vehicle;
    this.form = { ...data };
    this.modal = true;
  }

  closeModal(): void {
    this.modal = false;
    this.editingId = null;
    this.form = { plate: '', model: '', color: '', owner: '', type: 'Carro' };
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.vehicles = this.vehicles.filter((vehicle) => vehicle.id !== this.pendingDelete!.id);
    this.pendingDelete = null;
  }

  save() {
    if (this.form.plate && this.form.owner) {
      if (this.editingId !== null) {
        this.vehicles = this.vehicles.map((vehicle) =>
          vehicle.id === this.editingId ? { ...vehicle, ...this.form } : vehicle,
        );
        this.closeModal();
        return;
      }
      const nextId = Math.max(0, ...this.vehicles.map((vehicle) => vehicle.id)) + 1;
      this.vehicles = [...this.vehicles, { id: nextId, ...this.form }];
      this.closeModal();
    }
  }
}
