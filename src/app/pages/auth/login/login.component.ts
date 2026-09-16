import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  error = '';
  constructor(private router: Router) {}
  login(): void {
    this.error =
      !this.email || this.password.length < 6
        ? 'Informe o usuário e uma senha com pelo menos 6 caracteres.'
        : '';
    if (!this.error) this.router.navigate(['/dashboard']);
  }
}
