import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { passwordError, passwordHelp } from '../../../core/utils/password';
import { ActivatedRoute, Router } from '@angular/router';
import { ParkingRegistryService } from '../../../core/services/parking-registry.service';
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly api = inject(ParkingRegistryService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  email = '';
  password = '';
  showPassword = false;
  error = '';
  busy = false;
  resetToken = '';
  newPassword = '';
  confirmPassword = '';
  message = inject(ActivatedRoute).snapshot.queryParamMap.get('senhaAlterada') === '1' ? 'Senha alterada. Entre com sua nova senha.' : '';
  readonly passwordHelp = passwordHelp;
  cancelReset(): void {
    this.resetToken = ''; this.newPassword = ''; this.confirmPassword = ''; this.password = ''; this.error = '';
  }
  async completeReset(): Promise<void> {
    if (this.busy) return;
    this.error = passwordError(this.newPassword, this.confirmPassword);
    if (this.error) return;
    this.busy = true;
    try {
      await this.api.request('POST', '/auth/concluir-senha', {
        resetToken: this.resetToken, newPassword: this.newPassword, confirmPassword: this.confirmPassword,
      });
      this.cancelReset();
      this.message = 'Senha criada. Entre com sua nova senha.';
    } catch (error) { this.error = this.api.error(error); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }
  async login(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      this.message = '';
      const token = await this.api.login(this.email, this.password);
      this.password = '';
      if (token) this.resetToken = token;
      else await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
