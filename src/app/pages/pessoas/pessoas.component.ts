import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  ParkingRegistryService,
  RegisteredPerson,
} from '../../core/services/parking-registry.service';
@Component({ selector: 'app-pessoas', standalone: false, templateUrl: './pessoas.component.html' })
export class PessoasComponent implements OnInit {
  private readonly registry = inject(ParkingRegistryService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  ownerDocument: string | null = null;

  get selectedOwner(): RegisteredPerson | undefined {
    return this.people.find((person) => person.document === this.ownerDocument);
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.ownerDocument = params.get('proprietario');
    });
  }
  search = '';
  modal = false;
  editingPerson: RegisteredPerson | null = null;
  pendingDelete: RegisteredPerson | null = null;
  error = '';
  deleteError = '';
  form = { name: '', document: '', email: '', phone: '', type: 'Aluno' };
  get people(): RegisteredPerson[] {
    return this.registry.people;
  }
  set people(value: RegisteredPerson[]) {
    this.registry.people = value;
  }
  get filtered() {
    return this.people.filter((p) =>
      Object.values(p).join(' ').toLowerCase().includes(this.search.toLowerCase()),
    );
  }
  openCreate(): void {
    this.closeModal();
    this.modal = true;
  }

  edit(person: RegisteredPerson): void {
    this.editingPerson = person;
    this.form = { ...person };
    this.error = '';
    this.modal = true;
  }

  closeModal(): void {
    this.modal = false;
    this.editingPerson = null;
    this.error = '';
    this.form = { name: '', document: '', email: '', phone: '', type: 'Aluno' };
  }

  requestDelete(person: RegisteredPerson): void {
    this.pendingDelete = person;
    this.deleteError = '';
  }

  confirmDelete(): void {
    const person = this.pendingDelete;
    if (!person) return;
    if (this.registry.vehicles.some((vehicle) => this.sameName(vehicle.owner, person.name))) {
      this.deleteError =
        'Esta pessoa possui veículos vinculados. Altere o proprietário ou exclua esses veículos antes de excluir a pessoa.';
      return;
    }
    this.people = this.people.filter((item) => item !== person);
    this.pendingDelete = null;
  }

  private sameName(first: string, second: string): boolean {
    return first.trim().toLocaleLowerCase('pt-BR') === second.trim().toLocaleLowerCase('pt-BR');
  }

  save(): void {
    const data = { ...this.form, name: this.form.name.trim(), document: this.form.document.trim() };
    if (!data.name || !data.document) {
      this.error = 'Preencha o nome e o documento.';
      return;
    }
    if (
      this.people.some(
        (person) =>
          person !== this.editingPerson &&
          person.document.replace(/\W/g, '') === data.document.replace(/\W/g, ''),
      )
    ) {
      this.error = 'Já existe uma pessoa cadastrada com este documento.';
      return;
    }
    const original = this.editingPerson;
    if (original) {
      this.people = this.people.map((person) => (person === original ? data : person));
      this.registry.vehicles = this.registry.vehicles.map((vehicle) =>
        this.sameName(vehicle.owner, original.name) ? { ...vehicle, owner: data.name } : vehicle,
      );
    } else {
      this.people = [...this.people, data];
    }
    this.closeModal();
  }
}
