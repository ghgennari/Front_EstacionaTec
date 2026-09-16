import { Component } from '@angular/core';
@Component({ selector: 'app-saida', standalone: false, templateUrl: './saida.component.html' })
export class SaidaComponent {
  search = '';
  confirmed = '';
  vehicles = [
    { plate: 'ABC-1234', owner: 'Maria Silva', brand: 'Honda', model: 'Civic', entryTime: '08:30' },
    {
      plate: 'XYZ-5678',
      owner: 'Carlos Santos',
      brand: 'Toyota',
      model: 'Corolla',
      entryTime: '07:15',
    },
    { plate: 'DEF-9012', owner: 'Ana Paula', brand: 'Honda', model: 'CG 160', entryTime: '09:45' },
  ];
  get filtered() {
    return this.vehicles.filter((v) =>
      [v.plate, v.owner, v.brand, v.model, v.entryTime]
        .join(' ')
        .toLowerCase()
        .includes(this.search.trim().toLowerCase()),
    );
  }
  exit(plate: string): void {
    this.confirmed = plate;
    this.vehicles = this.vehicles.filter((v) => v.plate !== plate);
  }
}
