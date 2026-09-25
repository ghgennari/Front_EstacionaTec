import { inject } from '@angular/core';
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
