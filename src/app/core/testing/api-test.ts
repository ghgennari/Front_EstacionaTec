import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  CapturedImage,
  EntryRecord,
  RegisteredPerson,
  RegisteredVehicle,
} from '../services/parking-registry.service';
export function create<T>(component: Type<T>, role = 'Administrador') {
  sessionStorage.clear();
  sessionStorage.setItem('estacionatec-token', 'token-teste');
  sessionStorage.setItem('estacionatec-user', JSON.stringify({
    id: 1, name: 'Operador teste', username: 'teste', email: 'teste@example.com', role, status: 'Ativo',
  }));
  TestBed.configureTestingModule({
    declarations: [component],
    imports: [CommonModule, FormsModule, RouterModule],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(component);
  return {
    fixture,
    component: fixture.componentInstance,
    http: TestBed.inject(HttpTestingController),
  };
}
export const image: CapturedImage = {
  id: 10,
  plate: '',
  owner: '',
  time: '10:00:00',
  date: '2026-09-19',
  type: '',
  status: 'Pendente',
  fileName: 'teste.png',
  imagePath: '/api/imagens/10/arquivo',
  available: true,
};
export const person: RegisteredPerson = {
  id: 1,
  name: 'Pessoa de teste',
  document: '123',
  email: 'teste@example.com',
  phone: '',
  type: 'Aluno',
  active: true,
};
export const vehicle: RegisteredVehicle = {
  id: 1,
  plate: 'TST-1234',
  model: 'Teste',
  color: 'Azul',
  ownerId: 1,
  owner: person.name,
  type: 'Carro',
  category: 'Aluno',
  brand: 'Teste',
  authorized: true,
};
export const entry: EntryRecord = {
  id: 20,
  vehicleId: 1,
  plate: 'TST-1234',
  owner: person.name,
  category: 'Aluno',
  model: 'Teste',
  enteredAt: '2026-09-19T10:00:00',
  exitedAt: null,
  gateStatus: 'ERRO',
  warning: 'ESP32 não conectado.',
};
