import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ParkingRegistryService } from '../../../core/services/parking-registry.service';
@Component({
  selector: 'app-recuperar-senha',
  standalone: false,
  templateUrl: './recuperar-senha.component.html',
  styleUrl: '../login/login.component.css',
})
export class RecuperarSenhaComponent {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  email = '';
  sent = false;
  error = '';
  async send(): Promise<void> {
    this.error = '';
    try {
      await this.api.request('POST', '/auth/recuperar-senha', { email: this.email });
      this.sent = true;
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
}
