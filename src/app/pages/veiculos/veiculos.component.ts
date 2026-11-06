import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { formatDocument } from '../../core/utils/personal-data';
import {
  ParkingRegistryService,
  normalizePlate,
  RegisteredVehicle,
} from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-veiculos',
  standalone: false,
  templateUrl: './veiculos.component.html',
})
export class VeiculosComponent implements OnInit {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly formatDocument = formatDocument;
  search = '';
  modal = false;
  busy = false;
  editingId: number | null = null;
  pendingDelete: RegisteredVehicle | null = null;
  error = '';
  form = this.emptyForm();
  get canManage(): boolean {
    return this.api.isAdmin();
  }
  get vehicles() {
    return this.api.vehicles;
  }
  get people() {
    return this.api.people;
  }
  get filtered() {
    return this.vehicles.filter((v) =>
      Object.values(v).join(' ').toLowerCase().includes(this.search.toLowerCase())
      || normalizePlate(v.plate).includes(normalizePlate(this.search)),
    );
  }
  private emptyForm() {
    return {
      plate: '',
      model: '',
      color: '',
      ownerId: null as number | null,
      additionalOwnerIds: [] as (number | null)[],
      type: 'Carro',
      brand: '',
      authorized: true,
    };
  }
  category(vehicle: RegisteredVehicle): string {
    return vehicle.category;
  }
  async ngOnInit(): Promise<void> {
    try {
      await this.api.loadRegistry();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  openCreate(): void {
    if (!this.canManage) return;
    this.closeModal();
    this.modal = true;
  }
  edit(vehicle: RegisteredVehicle): void {
    if (!this.canManage) return;
    this.error = '';
    this.editingId = vehicle.id;
    this.form = {
      plate: vehicle.plate,
      model: vehicle.model,
      color: vehicle.color,
      ownerId: vehicle.ownerId,
      additionalOwnerIds: (vehicle.ownerIds ?? [vehicle.ownerId]).filter(id => id !== vehicle.ownerId),
      type: vehicle.type,
      brand: vehicle.brand ?? '',
      authorized: vehicle.authorized,
    };
    this.modal = true;
  }
  closeModal(): void {
    this.modal = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }
  async confirmDelete(): Promise<void> {
    if (!this.canManage || !this.pendingDelete || this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      await this.api.request('DELETE', '/veiculos/' + this.pendingDelete.id);
      this.pendingDelete = null;
      await this.api.loadRegistry();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
  addOwner(): void {
    if (this.form.additionalOwnerIds.length < 19) this.form.additionalOwnerIds.push(null);
  }
  ownerSelected(id: number | undefined, current: number | null): boolean {
    return id !== current && [this.form.ownerId, ...this.form.additionalOwnerIds].includes(id ?? null);
  }
  async save(): Promise<void> {
    if (!this.canManage || this.busy) return;
    this.error = '';
    const { additionalOwnerIds, ...fields } = this.form;
    const ownerIds = [fields.ownerId, ...additionalOwnerIds];
    if (ownerIds.some(id => id === null) || new Set(ownerIds).size !== ownerIds.length) {
      this.error = 'Selecione uma pessoa diferente para cada proprietário ou remova o campo vazio.';
      return;
    }
    this.busy = true;
    try {
      await this.api.request(
        this.editingId === null ? 'POST' : 'PUT',
        '/veiculos' + (this.editingId === null ? '' : '/' + this.editingId),
        { ...fields, ownerIds },
      );
      this.closeModal();
      await this.api.loadRegistry();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
