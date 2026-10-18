import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { normalizeDocument, normalizePhone, personalDataError, matchesPersonalData } from '../../core/utils/personal-data';
import { ParkingRegistryService, SystemUser } from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  search = '';
  modal = false;
  busy = false;
  editingUser: SystemUser | null = null;
  pendingDelete: SystemUser | null = null;
  error = '';
  users: SystemUser[] = [];
  form = this.emptyForm();
  private emptyForm() {
    return { name: '', username: '', email: '', document: '', phone: '', role: 'Porteiro', status: 'Ativo', password: '' };
  }
  get filtered() {
    return this.users.filter((u) =>
      Object.values(u).join(' ').toLowerCase().includes(this.search.trim().toLowerCase())
      || matchesPersonalData(this.search.trim(), u.document, u.phone),
    );
  }
  get administrators() {
    return this.users.filter((u) => u.role === 'Administrador').length;
  }
  get gatekeepers() {
    return this.users.filter((u) => u.role === 'Porteiro').length;
  }
  async ngOnInit(): Promise<void> {
    try {
      this.users = await this.api.request<SystemUser[]>('GET', '/usuarios');
      for (const user of this.users) this.api.syncUser(user);
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  openCreate(): void {
    this.closeModal();
    this.modal = true;
  }
  edit(user: SystemUser): void {
    this.editingUser = user;
    this.form = { ...user, document: normalizeDocument(user.document), phone: normalizePhone(user.phone), password: '' };
    this.error = '';
    this.modal = true;
  }
  closeModal(): void {
    this.modal = false;
    this.editingUser = null;
    this.error = '';
    this.form = this.emptyForm();
  }
  async confirmDelete(): Promise<void> {
    if (!this.pendingDelete || this.busy) return;
    this.busy = true;
    try {
      await this.api.request('DELETE', '/usuarios/' + this.pendingDelete.id);
      this.pendingDelete = null;
      await this.ngOnInit();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
  async save(): Promise<void> {
    if (this.busy) return;
    this.error = personalDataError(this.form.document, this.form.phone);
    if (this.error) return;
    this.busy = true;
    this.error = '';
    try {
      const saved = await this.api.request<SystemUser>(
        this.editingUser ? 'PUT' : 'POST',
        '/usuarios' + (this.editingUser ? '/' + this.editingUser.id : ''),
        this.form,
      );
      if (!saved.personId || saved.document !== this.form.document || saved.phone !== this.form.phone) {
        throw new Error('A API não confirmou CPF, telefone e vínculo com a pessoa. Atualize o back-end no servidor e salve novamente.');
      }
      this.api.syncUser(saved);
      this.closeModal();
      await this.ngOnInit();
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
