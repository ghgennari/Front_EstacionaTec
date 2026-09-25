import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { create } from './testing/api-test';
import { adminGuard } from './auth.guard';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

describe('Permissões do porteiro', () => {
  it('oculta telas administrativas e bloqueia a rota direta', () => {
    const { fixture } = create(SidebarComponent, 'Porteiro');
    fixture.detectChanges();
    for (const path of ['pessoas', 'usuarios', 'relatorios']) {
      expect(fixture.nativeElement.querySelector(`a[href="/${path}"]`)).toBeNull();
    }
    for (const path of ['veiculos', 'entrada', 'saida', 'historico', 'monitoramento', 'imagens', 'dashboard']) {
      expect(fixture.nativeElement.querySelector(`a[href="/${path}"]`)).not.toBeNull();
    }
    const result = TestBed.runInInjectionContext(() => adminGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/dashboard']));
  });

  it('mantém o acesso administrativo', () => {
    const { fixture } = create(SidebarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/pessoas"]')).not.toBeNull();
    expect(TestBed.runInInjectionContext(() => adminGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ))).toBe(true);
  });
});
