import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsoDeAPI } from './Servicios/uso-de-api';

export const authGuard: CanActivateFn = () => {
  const api = inject(UsoDeAPI);
  const router = inject(Router);

  if (api.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
