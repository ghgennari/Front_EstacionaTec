import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ParkingRegistryService } from './services/parking-registry.service';
export const authGuard: CanActivateFn = () =>
  inject(ParkingRegistryService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

export const adminGuard: CanActivateFn = () => {
  const api = inject(ParkingRegistryService);
  const router = inject(Router);
  if (!api.isLoggedIn()) return router.createUrlTree(['/login']);
  return api.isAdmin() || router.createUrlTree(['/dashboard']);
};
