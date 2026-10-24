import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { create } from '../testing/api-test';
import { LoginComponent } from '../../pages/auth/login/login.component';
import { HeaderComponent } from '../../layout/header/header.component';
import { UsuariosComponent } from '../../pages/usuarios/usuarios.component';
import { ParkingRegistryService } from '../services/parking-registry.service';
import { passwordError } from './password';

describe('Política de senha', () => {
  for (const password of ['123456', 'somenteletras', 'SOMENTELETRAS', 'SenhaSemNumero!', 'SenhaSemSimbolo123', 'Senha Curta1!', 'A1!' + 'a'.repeat(70)]) {
    it('rejeita senha incompleta ou longa: ' + password.slice(0, 12), () => expect(passwordError(password)).not.toBe(''));
  }
  it('aceita todos os requisitos e verifica a confirmação', () => {
    expect(passwordError('MinhaSenha123!', 'MinhaSenha123!')).toBe('');
    expect(passwordError('MinhaSenha123!', 'OutraSenha123!')).toContain('conferem');
  });
});

describe('Troca obrigatória no login', () => {
  it('não armazena credencial temporária nem libera sessão antes de trocar', async () => {
    const { component, fixture, http } = create(LoginComponent);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.email = 'porteiro'; component.password = 'Temporaria123!';
    const login = component.login();
    http.expectOne('/api/auth/login').flush({ passwordChangeRequired: true, resetToken: 'restrito', token: null, user: null });
    await login; fixture.detectChanges();
    expect(component.resetToken).toBe('restrito');
    expect(component.password).toBe('');
    expect(sessionStorage.getItem('estacionatec-token')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Crie sua nova senha');
    component.newPassword = 'MinhaSenha123!'; component.confirmPassword = 'OutraSenha123!';
    await component.completeReset();
    http.expectNone('/api/auth/concluir-senha');
    component.confirmPassword = component.newPassword;
    const changing = component.completeReset();
    const req = http.expectOne('/api/auth/concluir-senha');
    expect(req.request.body.resetToken).toBe('restrito');
    req.flush({ message: 'Senha criada' });
    await changing;
    expect(component.resetToken).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.message).toContain('Entre com sua nova senha');
    http.verify();
  });
});

describe('Troca pelo próprio usuário', () => {
  it('abre modal pela engrenagem, exige senha atual e encerra sessão após salvar', async () => {
    const { component, fixture, http } = create(HeaderComponent, 'Porteiro');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Alterar minha senha"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    component.newPassword = 'MinhaSenha123!'; component.confirmPassword = component.newPassword;
    await component.savePassword();
    http.expectNone('/api/auth/senha');
    component.currentPassword = 'SenhaAntiga123!';
    const saving = component.savePassword();
    const req = http.expectOne('/api/auth/senha');
    expect(req.request.body.currentPassword).toBe('SenhaAntiga123!');
    req.flush({ message: 'Senha alterada' });
    await saving;
    expect(component.passwordModal).toBe(false);
    expect(component.currentPassword).toBe('');
    expect(TestBed.inject(ParkingRegistryService).isLoggedIn()).toBe(false);
    http.verify();
  });
});

describe('Redefinição administrativa', () => {
  it('substitui edição direta por emissão explícita de credencial temporária', async () => {
    const { component, fixture, http } = create(UsuariosComponent);
    const user = { id: 2, name: 'Porteiro', username: 'porteiro', email: 'p@example.test', role: 'Porteiro', status: 'Ativo', document: '12345678909', phone: '11987654321', personId: 2 };
    fixture.detectChanges(); http.expectOne('/api/usuarios').flush([user]);
    await fixture.whenStable();
    component.edit(user); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#user-password')).toBeNull();
    component.closeModal(); component.requestReset(user); fixture.detectChanges();
    http.expectNone('/api/usuarios/2/redefinir-senha');
    const reset = component.confirmReset();
    http.expectOne('/api/usuarios/2/redefinir-senha').flush({ temporaryPassword: 'SenhaTemporaria123!', expiresAt: '2026-10-24T15:30:00Z' });
    await reset; fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#temporary-password').value).toBe('SenhaTemporaria123!');
    component.closeReset(); expect(component.resetResult).toBeNull();
    http.verify();
  });
});
