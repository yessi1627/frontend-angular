import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NombreRol } from './modelos';
import { SesionService } from './servicios/sesion.service';

// Solo deja pasar si hay sesion; si no, lleva al login recordando a donde queria ir
export const autenticadoGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(SesionService);
  return sesion.autenticado()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

// Solo deja pasar a los roles indicados en data.roles de la ruta
export const rolGuard: CanActivateFn = (ruta) => {
  const roles = (ruta.data['roles'] ?? []) as NombreRol[];
  return inject(SesionService).tieneRol(...roles)
    ? true
    : inject(Router).createUrlTree(['/inicio']);
};

// La pantalla de login no tiene sentido si ya hay sesion
export const invitadoGuard: CanActivateFn = () =>
  inject(SesionService).autenticado() ? inject(Router).createUrlTree(['/inicio']) : true;
