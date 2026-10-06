import { Injectable, inject } from '@angular/core';
import { catchError, defer, exhaustMap, of, shareReplay, timer } from 'rxjs';
import { ParkingRegistryService } from './parking-registry.service';

export interface OcrState {
  enabled: boolean;
  status: string;
  message: string;
  detectionId: string | null;
  plate: string | null;
  confidence: number | null;
  detectedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  private readonly api = inject(ParkingRegistryService);
  // Compartilha a consulta entre telas e encerra o polling ao sair delas.
  readonly states = timer(0, 2000).pipe(
    exhaustMap(() => defer(() => this.api.request<OcrState>('POST', '/camera/ocr/acompanhar')).pipe(
      catchError(() => of<OcrState>({
        enabled: true, status: 'INDISPONIVEL',
        message: 'OCR indisponível. Você pode digitar a placa manualmente.',
        detectionId: null, plate: null, confidence: null, detectedAt: null,
      })),
    )),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
