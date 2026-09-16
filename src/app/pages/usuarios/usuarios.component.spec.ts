import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { UsuariosComponent } from './usuarios.component';

describe('Ações de usuários', () => {
  it('edita o cadastro sem duplicar o usuário nem exigir senha', () => {
    const component = new UsuariosComponent();
    component.edit(component.users[1]);
    component.form.name = 'Marcos Atualizado';
    component.form.username = 'marcos.novo';
    component.form.role = 'Administrador';
    component.form.status = 'Inativo';
    component.save();
    expect(component.users.length).toBe(3);
    expect(component.users[1].username).toBe('marcos.novo');
    expect(component.users[1].status).toBe('Inativo');
    expect(component.administrators).toBe(2);
    expect(component.gatekeepers).toBe(1);
    expect(component.modal).toBe(false);
  });

  it('descarta alterações ao cancelar e limpa o formulário de criação', () => {
    const component = new UsuariosComponent();
    component.edit(component.users[0]);
    component.form.name = 'Alterado';
    component.closeModal();
    expect(component.users[0].name).toBe('João Carlos');
    component.openCreate();
    expect(component.editingUser).toBeNull();
    expect(component.form.name).toBe('');
  });

  it('impede nome de usuário duplicado e campos obrigatórios vazios', () => {
    const component = new UsuariosComponent();
    component.edit(component.users[1]);
    component.form.username = ' JOAO.CARLOS ';
    component.save();
    expect(component.error).toContain('Já existe');
    component.form.name = '   ';
    component.save();
    expect(component.error).toContain('Preencha');
    expect(component.users[1].username).toBe('marcos.oliveira');
  });

  it('mantém a criação com validação de senha', () => {
    const component = new UsuariosComponent();
    component.openCreate();
    component.form = {
      name: 'Novo',
      username: 'novo',
      email: 'novo@edu.br',
      role: 'Porteiro',
      status: 'Ativo',
      password: '123',
    };
    component.save();
    expect(component.users.length).toBe(3);
    component.form.password = '123456';
    component.save();
    expect(component.users.length).toBe(4);
    expect(component.users[3]).not.toHaveProperty('password');
  });

  it('exclui somente na confirmação e atualiza os contadores até a lista ficar vazia', () => {
    const component = new UsuariosComponent();
    component.pendingDelete = component.users[0];
    expect(component.users.length).toBe(3);
    component.pendingDelete = null;
    component.confirmDelete();
    expect(component.users.length).toBe(3);
    while (component.users.length) {
      component.pendingDelete = component.users[0];
      component.confirmDelete();
    }
    expect(component.administrators).toBe(0);
    expect(component.gatekeepers).toBe(0);
  });

  it('exibe ações e abre a confirmação sem excluir imediatamente', async () => {
    await TestBed.configureTestingModule({
      declarations: [UsuariosComponent],
      imports: [FormsModule],
    }).compileComponents();
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('tbody tr')[0].children.length).toBe(6);
    const buttons = root.querySelectorAll<HTMLButtonElement>('tbody tr:first-child button');
    buttons[0].click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Editar Usuário');
    fixture.componentInstance.closeModal();
    buttons[1].click();
    fixture.detectChanges();
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain('João Carlos');
    expect(fixture.componentInstance.users.length).toBe(3);
  });
});
