import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MonitoramentoComponent } from './monitoramento.component';

describe('MonitoramentoComponent', () => {
  it('atualiza a prévia e encerra os temporizadores ao sair da tela', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ declarations: [MonitoramentoComponent] });
    const fixture = TestBed.createComponent(MonitoramentoComponent);
    const component = fixture.componentInstance;
    const initialTime = component.currentTime.getTime();
    component.refresh();
    expect(component.refreshing).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(component.currentTime.getTime()).toBeGreaterThan(initialTime);
    expect(component.refreshing).toBe(false);
    expect(component.message).toContain('não está conectada');
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
