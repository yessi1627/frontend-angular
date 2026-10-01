import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../servicios/sesion.service';

/**
 * Interceptor de todas las peticiones a la API:
 *  - withCredentials: envia la cookie de sesion PHP (el backend esta en otro puerto).
 *  - X-Requested-With: la API la exige en POST/PUT/DELETE como proteccion CSRF.
 *  - Si la API responde 401 (sesion vencida), limpio la sesion y llevo al login.
 */
export const apiInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  if (!peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }
  const sesion = inject(SesionService);
  const router = inject(Router);

  const conCredenciales = peticion.clone({
    withCredentials: true,
    setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  return siguiente(conCredenciales).pipe(
    catchError((error: unknown) => {
      const esLogin = peticion.url.endsWith('/auth/login') || peticion.url.endsWith('/auth/me');
      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        sesion.limpiar();
        router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => error);
    }),
  );
};
