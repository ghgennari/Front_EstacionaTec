import { Component, inject } from '@angular/core';

import { ParkingRegistryService } from '../../core/services/parking-registry.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly api = inject(ParkingRegistryService);
}
