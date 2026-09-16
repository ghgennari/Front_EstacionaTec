import { Injectable } from '@angular/core';

export interface RegisteredVehicle {
  id: number;
  plate: string;
  model: string;
  color: string;
  owner: string;
  type: string;
}

export interface RegisteredPerson {
  name: string;
  document: string;
  email: string;
  phone: string;
  type: string;
}

export interface EntryRecord {
  id: number;
  vehicleId: number;
  plate: string;
  owner: string;
  category: string;
  model: string;
  enteredAt: Date;
}

export function normalizePlate(value: string): string {
  return value.trim().toUpperCase().replace('-', '');
}

@Injectable({ providedIn: 'root' })
export class ParkingRegistryService {
  vehicles: RegisteredVehicle[] = [
    {
      id: 1,
      plate: 'ABC-1234',
      model: 'Honda Civic',
      color: 'Prata',
      owner: 'Maria Silva',
      type: 'Carro',
    },
    {
      id: 2,
      plate: 'XYZ-5678',
      model: 'Toyota Corolla',
      color: 'Preto',
      owner: 'Carlos Santos',
      type: 'Carro',
    },
    {
      id: 3,
      plate: 'DEF-9012',
      model: 'Honda CG 160',
      color: 'Vermelha',
      owner: 'Ana Paula',
      type: 'Moto',
    },
  ];
  people: RegisteredPerson[] = [
    {
      name: 'Maria Silva',
      document: '123.456.789-00',
      email: 'maria@edu.br',
      phone: '(11) 99999-1111',
      type: 'Aluno',
    },
    {
      name: 'Carlos Santos',
      document: '987.654.321-00',
      email: 'carlos@edu.br',
      phone: '(11) 99999-2222',
      type: 'Professor',
    },
    {
      name: 'Ana Paula',
      document: '456.789.123-00',
      email: 'ana@edu.br',
      phone: '(11) 99999-3333',
      type: 'Funcionário',
    },
  ];
  readonly entries: EntryRecord[] = [];

  registerEntry(value: string): EntryRecord {
    if (!/^[a-z]{3}-?\d{4}$/i.test(value.trim())) {
      throw new Error('Informe uma placa válida no formato ABC-1234 ou ABC1234.');
    }
    const plate = normalizePlate(value);
    const vehicle = this.vehicles.find((item) => normalizePlate(item.plate) === plate);
    if (!vehicle) {
      throw new Error('Veículo não autorizado ou não cadastrado no sistema.');
    }
    const person = this.people.find(
      (item) =>
        item.name.trim().toLocaleLowerCase('pt-BR') ===
        vehicle.owner.trim().toLocaleLowerCase('pt-BR'),
    );
    if (!person) {
      throw new Error('O proprietário deste veículo não foi encontrado no cadastro de pessoas.');
    }
    const entry: EntryRecord = {
      id: this.entries.length + 1,
      vehicleId: vehicle.id,
      plate: plate.slice(0, 3) + '-' + plate.slice(3),
      owner: person.name,
      category: person.type,
      model: vehicle.model,
      enteredAt: new Date(),
    };
    this.entries.push(entry);
    return entry;
  }
}
