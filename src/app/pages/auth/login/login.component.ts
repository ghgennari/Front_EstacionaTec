import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  async login(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      await this.api.login(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }
}
