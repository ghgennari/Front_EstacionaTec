import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

describe('Login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule, RouterModule],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('preserva login e armazenamento da sessão', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.email = 'admin@example.com';
    component.password = 'SenhaTeste123!';
    const login = component.login();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ email: component.email, password: component.password });
    request.flush({ token: 'token-login', user: { id: 1, role: 'Administrador' } });
    await login;
    expect(sessionStorage.getItem('estacionatec-token')).toBe('token-login');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.busy).toBe(false);
    http.verify();
  });

  it('mantém apenas o formulário de login sem link de recuperação', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('form button[type="submit"]')?.textContent).toContain('Entrar');
    expect(page.querySelector('a')).toBeNull();
    expect(page.textContent).not.toContain('Esqueceu a senha');
  });

  it('apresenta a mensagem de excesso de tentativas e permite tentar depois', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const login = fixture.componentInstance.login();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/login').flush({ message: 'Aguarde um minuto antes de tentar novamente.' },
      { status: 429, statusText: 'Too Many Requests' });
    await login;
    expect(fixture.componentInstance.error).toContain('Aguarde');
    expect(fixture.componentInstance.busy).toBe(false);
    expect(sessionStorage.getItem('estacionatec-token')).toBeNull();
    http.verify();
  });
});
