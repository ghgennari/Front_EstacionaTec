import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface RegisteredPerson {
  id?: number;
  name: string;
  document: string | null;
  email: string;
  phone: string;
  type: string;
  active?: boolean;
}
export interface RegisteredVehicle {
  id: number;
  plate: string;
  model: string;
  color: string;
  ownerId: number;
  owner: string;
  type: string;
  category: string;
  brand: string;
  authorized: boolean;
}
export interface SystemUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
}
export interface EntryRecord {
  id: number;
  vehicleId: number | null;
  plate: string;
  owner: string;
  category: string;
  model: string;
  enteredAt: string;
  exitedAt: string | null;
  gateStatus: string;
  warning: string | null;
}
export interface HistoryRecord {
  id: number;
  plate: string;
  owner: string;
  ownerDocument: string | null;
  model: string;
  entry: string;
  exit: string | null;
  category: string;
  brand: string | null;
}
export interface CapturedImage {
  id: number;
  plate: string;
  owner: string;
  time: string;
  date: string;
  type: string;
  status: string;
  fileName: string;
  imagePath: string;
  available: boolean;
}
export interface Report {
  id: number;
  name: string;
  date: string;
  size: string;
  available: boolean;
}
export interface RecentEvent {
  id: number;
  plate: string;
  owner: string;
  time: string;
  status: string;
  gateStatus: string;
}
export function normalizePlate(value: string): string {
  return value.trim().toUpperCase().replace('-', '');
}

@Injectable({ providedIn: 'root' })
export class ParkingRegistryService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly peopleState = signal<RegisteredPerson[]>([]);
  private readonly vehiclesState = signal<RegisteredVehicle[]>([]);
  readonly user = signal<SystemUser | null>(this.savedUser());
  private token = sessionStorage.getItem('estacionatec-token') ?? '';
  get people(): RegisteredPerson[] {
    return this.peopleState();
  }
  get vehicles(): RegisteredVehicle[] {
    return this.vehiclesState();
  }
  isLoggedIn(): boolean {
    return !!this.token;
  }

  private savedUser(): SystemUser | null {
    try {
      return JSON.parse(sessionStorage.getItem('estacionatec-user') ?? 'null');
    } catch {
      return null;
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.http.request<T>(method, '/api' + path, {
          body,
          headers: new HttpHeaders(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        }),
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401 && path !== '/auth/login') {
        this.clearSession();
        void this.router.navigate(['/login']);
      }
      throw error;
    }
  }

  error(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0
        ? 'Não foi possível conectar à API. Verifique se o servidor está iniciado.'
        : (error.error?.message ?? 'Não foi possível concluir a operação.');
    }
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  }

  async login(email: string, password: string): Promise<void> {
    const result = await this.request<{ token: string; user: SystemUser }>('POST', '/auth/login', {
      email,
      password,
    });
    this.token = result.token;
    this.user.set(result.user);
    sessionStorage.setItem('estacionatec-token', result.token);
    sessionStorage.setItem('estacionatec-user', JSON.stringify(result.user));
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout');
    } finally {
      this.clearSession();
      void this.router.navigate(['/login']);
    }
  }

  private clearSession(): void {
    this.token = '';
    this.user.set(null);
    this.peopleState.set([]);
    this.vehiclesState.set([]);
    sessionStorage.removeItem('estacionatec-token');
    sessionStorage.removeItem('estacionatec-user');
  }

  isAdmin(): boolean {
    return this.user()?.role === 'Administrador';
  }

  async loadRegistry(): Promise<void> {
    const [people, vehicles] = await Promise.all([
      this.isAdmin() ? this.request<RegisteredPerson[]>('GET', '/pessoas') : Promise.resolve([]),
      this.request<RegisteredVehicle[]>('GET', '/veiculos'),
    ]);
    this.peopleState.set(people);
    this.vehiclesState.set(vehicles);
  }

  async upload(file: File): Promise<CapturedImage> {
    const form = new FormData();
    form.append('file', file);
    return this.request('POST', '/imagens', form);
  }

  async blob(path: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get('/api' + path, {
        headers: new HttpHeaders({ Authorization: 'Bearer ' + this.token }),
        responseType: 'blob',
      }),
    );
  }

  async download(path: string, filename: string): Promise<void> {
    const url = URL.createObjectURL(await this.blob(path));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
