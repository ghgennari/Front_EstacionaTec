import { passwordError, passwordHelp } from '../../core/utils/password';
import { ChangeDetectorRef, inject } from '@angular/core';
import { ParkingRegistryService } from '../../core/services/parking-registry.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  passwordModal = false;
  passwordBusy = false;
  passwordError = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly passwordHelp = passwordHelp;
  openPassword(): void {
    this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; this.passwordError = '';
    this.passwordModal = true;
  }
  closePassword(): void {
    if (this.passwordBusy) return;
    this.passwordModal = false;
    this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; this.passwordError = '';
  }
  async savePassword(): Promise<void> {
    if (this.passwordBusy) return;
    this.passwordError = !this.currentPassword ? 'Informe sua senha atual.' : passwordError(this.newPassword, this.confirmPassword);
    if (this.passwordError) return;
    this.passwordBusy = true;
    try {
      await this.api.request('POST', '/auth/senha', {
        currentPassword: this.currentPassword, newPassword: this.newPassword, confirmPassword: this.confirmPassword,
      });
      this.api.clearSession();
      this.passwordBusy = false;
      this.closePassword();
      await this.router.navigate(['/login'], { queryParams: { senhaAlterada: '1' } });
    } catch (error) { this.passwordError = this.api.error(error); }
    finally { this.passwordBusy = false; this.cdr.markForCheck(); }
  }
  logout(): void {
    void this.api.logout().catch(() => {});
  }
  @Input() sidebarOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  title = 'Dashboard';
  readonly date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let current = this.route;
        while (current.firstChild) current = current.firstChild;
        this.title = current.snapshot.data['title'] ?? 'Dashboard';
      });
  }
}
