import { create } from '../../core/testing/api-test';
import { UsuariosComponent } from './usuarios.component';
import { PessoasComponent } from '../pessoas/pessoas.component';

describe('CPF e telefone obrigatórios', () => {
  for (const page of [PessoasComponent, UsuariosComponent]) {
    it('rejeita vazios, letras e comprimentos incorretos em ' + page.name, async () => {
      const { component, http } = page === PessoasComponent ? create(PessoasComponent) : create(UsuariosComponent);
      for (const document of ['', '1234567890', '123456789012', 'a2345678901', '123.456.789-09']) {
        component.form.document = document;
        component.form.phone = '11987654321';
        await component.save();
        expect(component.error).toContain('CPF');
      }
      for (const phone of ['', '119876543', '5511987654321', '1198765432a', '(11) 98765-4321']) {
        component.form.document = '12345678909';
        component.form.phone = phone;
        await component.save();
        expect(component.error).toContain('telefone');
      }
      http.expectNone(request => request.method === 'POST' || request.method === 'PUT');
      http.verify();
    });
  }

  for (const phone of ['1134567890', '11987654321']) {
    it('carrega e salva os dados da pessoa vinculada ao usuário: ' + phone.length + ' dígitos', async () => {
      const { component, fixture, http } = create(UsuariosComponent);
      fixture.detectChanges();
      http.expectOne('/api/usuarios').flush([]);
      await new Promise(resolve => setTimeout(resolve, 0));
      const user = { id: 20, name: 'Pessoa', username: 'pessoa', email: 'pessoa@example.test',
        role: 'Porteiro', status: 'Ativo', document: '12345678909', phone };
      component.edit(user);
      fixture.detectChanges();
      await fixture.whenStable();
      const cpf = fixture.nativeElement.querySelector('input[name="document"]') as HTMLInputElement;
      const telephone = fixture.nativeElement.querySelector('input[name="phone"]') as HTMLInputElement;
      expect(cpf.value).toBe('123.456.789-09');
      expect(telephone.value.replace(/[^0-9]/g, '')).toBe(phone);
      const saving = component.save();
      const request = http.expectOne('/api/usuarios/20');
      expect(request.request.body.document).toBe('12345678909');
      expect(request.request.body.phone).toBe(phone);
      request.flush(user);
      await new Promise(resolve => setTimeout(resolve, 0));
      http.expectOne('/api/usuarios').flush([user]);
      await saving;
      expect(component.modal).toBe(false);
      http.verify();
    });
  }
});
