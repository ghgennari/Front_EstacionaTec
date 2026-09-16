import { Component } from '@angular/core';

interface SystemUser {
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
}
@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  search = '';
  modal = false;
  editingUser: SystemUser | null = null;
  pendingDelete: SystemUser | null = null;
  error = '';
  form = { name: '', username: '', email: '', role: 'Porteiro', status: 'Ativo', password: '' };
  users: SystemUser[] = [
    {
      name: 'João Carlos',
      username: 'joao.carlos',
      email: 'joao@edu.br',
      role: 'Administrador',
      status: 'Ativo',
    },
    {
      name: 'Marcos Oliveira',
      username: 'marcos.oliveira',
      email: 'marcos@edu.br',
      role: 'Porteiro',
      status: 'Ativo',
    },
    {
      name: 'Juliana Souza',
      username: 'juliana.souza',
      email: 'juliana@edu.br',
      role: 'Porteiro',
      status: 'Inativo',
    },
  ];
  get filtered() {
    return this.users.filter((u) =>
      Object.values(u).join(' ').toLowerCase().includes(this.search.toLowerCase()),
    );
  }
  get administrators(): number {
    return this.users.filter((user) => user.role === 'Administrador').length;
  }

  get gatekeepers(): number {
    return this.users.filter((user) => user.role === 'Porteiro').length;
  }

  openCreate(): void {
    this.closeModal();
    this.modal = true;
  }

  edit(user: SystemUser): void {
    this.editingUser = user;
    this.form = { ...user, password: '' };
    this.error = '';
    this.modal = true;
  }

  closeModal(): void {
    this.modal = false;
    this.editingUser = null;
    this.error = '';
    this.form = {
      name: '',
      username: '',
      email: '',
      role: 'Porteiro',
      status: 'Ativo',
      password: '',
    };
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.users = this.users.filter((user) => user !== this.pendingDelete);
    this.pendingDelete = null;
  }

  save(): void {
    const { password, ...data } = this.form;
    const user = {
      ...data,
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
    };
    if (!user.name || !user.username || !user.email) {
      this.error = 'Preencha nome, usuário e e-mail.';
      return;
    }
    if (!this.editingUser && password.length < 6) {
      this.error = 'A senha deve conter pelo menos 6 caracteres.';
      return;
    }
    if (
      this.users.some(
        (item) =>
          item !== this.editingUser && item.username.toLowerCase() === user.username.toLowerCase(),
      )
    ) {
      this.error = 'Já existe um cadastro com este nome de usuário.';
      return;
    }
    this.users = this.editingUser
      ? this.users.map((item) => (item === this.editingUser ? user : item))
      : [...this.users, user];
    this.closeModal();
  }
}
