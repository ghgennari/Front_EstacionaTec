import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { formatDocument, formatPhone, normalizeDocument, normalizePhone, matchesPersonalData, personalDataError } from '../../core/utils/personal-data';
import {
  ParkingRegistryService,
  RegisteredPerson,
} from '../../core/services/parking-registry.service';
@Component({ selector: 'app-pessoas', standalone: false, templateUrl: './pessoas.component.html' })
export class PessoasComponent implements OnInit {
  private readonly api = inject(ParkingRegistryService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly formatDocument = formatDocument;
  readonly formatPhone = formatPhone;
  ownerDocument: string | null = null;
  search = '';
  modal = false;
  busy = false;
  editingPerson: RegisteredPerson | null = null;
  pendingDelete: RegisteredPerson | null = null;
  error = '';
  deleteError = '';
  form = this.emptyForm();
  get people() {
    return this.api.people;
  }
  get selectedOwner() {
    const document = normalizeDocument(this.ownerDocument);
    return document ? this.people.find((p) => normalizeDocument(p.document) === document) : undefined;
  }
  get filtered() {
    return this.people.filter((p) =>
      Object.values(p).join(' ').toLowerCase().includes(this.search.trim().toLowerCase())
      || matchesPersonalData(this.search.trim(), p.document, p.phone),
    );
  }
  private emptyForm() {
    return { name: '', document: '', email: '', phone: '', type: 'Aluno', active: true };
  }
  async ngOnInit(): Promise<void> {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => (this.ownerDocument = params.get('proprietario')));
    try {
      await this.api.loadRegistry();
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
  edit(person: RegisteredPerson): void {
    this.editingPerson = person;
    this.form = {
      name: person.name,
      document: normalizeDocument(person.document),
      email: person.email ?? '',
      phone: normalizePhone(person.phone),
      type: person.type,
      active: person.active ?? true,
    };
    this.error = '';
    this.modal = true;
  }
  closeModal(): void {
    this.modal = false;
    this.editingPerson = null;
    this.error = '';
    this.form = this.emptyForm();
  }
  requestDelete(person: RegisteredPerson): void {
    this.pendingDelete = person;
    this.deleteError = '';
  }
  async confirmDelete(): Promise<void> {
    if (!this.pendingDelete || this.busy) return;
    this.busy = true;
    try {
      await this.api.request('DELETE', '/pessoas/' + this.pendingDelete.id);
      this.pendingDelete = null;
      await this.api.loadRegistry();
    } catch (error) {
      this.deleteError = this.api.error(error);
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
      const saved = await this.api.request<RegisteredPerson>(
        this.editingPerson ? 'PUT' : 'POST',
        '/pessoas' + (this.editingPerson ? '/' + this.editingPerson.id : ''),
        { ...this.form, document: normalizeDocument(this.form.document), phone: normalizePhone(this.form.phone) },
      );
      this.api.syncPerson(saved);
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
