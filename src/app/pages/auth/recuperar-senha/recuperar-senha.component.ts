import { Component } from '@angular/core';
@Component({
  selector: 'app-recuperar-senha',
  standalone: false,
  templateUrl: './recuperar-senha.component.html',
  styleUrl: '../login/login.component.css',
})
export class RecuperarSenhaComponent {
  email = '';
  sent = false;
  error = '';
  send(): void {
    this.error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) ? '' : 'Informe um e-mail válido.';
    if (!this.error) this.sent = true;
  }
}
