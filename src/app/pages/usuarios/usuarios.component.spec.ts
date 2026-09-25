import { create } from '../../core/testing/api-test';
import { UsuariosComponent } from './usuarios.component';
describe('Usuários integrados', () => {
  it('apresenta erro de permissão ao operador sem inventar usuários locais', async () => {
    const { component, http } = create(UsuariosComponent);
    const load = component.ngOnInit();
    http
      .expectOne('/api/usuarios')
      .flush(
        { message: 'Seu perfil não permite esta operação.' },
        { status: 403, statusText: 'Forbidden' },
      );
    await load;
    expect(component.users).toEqual([]);
    expect(component.error).toContain('perfil');
    http.verify();
  });
});
