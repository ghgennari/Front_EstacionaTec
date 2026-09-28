import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestId } from './request-id';
import { create } from './testing/api-test';
import { EntradaComponent } from '../pages/entrada/entrada.component';
import { SaidaComponent } from '../pages/saida/saida.component';

describe('Identificador em HTTP na rede local', () => {
  afterEach(() => vi.unstubAllGlobals());

  function simulateHttp(): void {
    const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    vi.stubGlobal('crypto', { getRandomValues });
  }

  it('gera UUIDs v4 distintos sem randomUUID', () => {
    simulateHttp();
    const ids = Array.from({ length: 100 }, () => createRequestId());
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inicializa a tela de entrada sem randomUUID', () => {
    simulateHttp();
    expect(() => create(EntradaComponent)).not.toThrow();
  });

  it('inicializa a tela de saida sem randomUUID', () => {
    simulateHttp();
    expect(() => create(SaidaComponent)).not.toThrow();
  });
});
