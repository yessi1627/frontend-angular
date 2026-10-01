import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../servicios/sesion.service';

// Tiempo maximo de espera por peticion; las subidas de archivos tienen mas margen
const LIMITE_MS = 15000;
const LIMITE_SUBIDA_MS = 60000;
const REINTENTOS_LECTURA = 2;

// Solo reintento errores transitorios: sin conexion (0), 502, 503, 504 o tiempo agotado
const esTransitorio = (error: unknown): boolean =>
  (error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status)) ||
  (error instanceof Error && error.name === 'TimeoutError');

/**
 * Interceptor de todas las peticiones a la API:
 *  - withCredentials: envia la cookie de sesion PHP (el backend esta en otro puerto).
 *  - X-Requested-With: la API la exige en POST/PUT/DELETE como proteccion CSRF.
 *  - TOLERANCIA A FALLOS:
 *      timeout(): si el servidor no responde a tiempo, corto la espera con un error claro
 *      en vez de dejar la pantalla cargando para siempre.
 *      retry() con espera exponencial (500 ms, 1 s) solo en lecturas GET: son idempotentes,
 *      repetirlas no duplica datos. Un POST no se reintenta para no crear registros dobles.
 *  - Si la API responde 401 (sesion vencida), limpio la sesion y llevo al login.
 */
export const apiInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  // Aplica a todo lo que pasa por el API Gateway: API PHP y microservicios
  if (!peticion.url.startsWith(environment.gatewayUrl)) {
    return siguiente(peticion);
  }
  const sesion = inject(SesionService);
  const router = inject(Router);

  const conCredenciales = peticion.clone({
    withCredentials: true,
    setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  const limite = peticion.body instanceof FormData ? LIMITE_SUBIDA_MS : LIMITE_MS;

  return siguiente(conCredenciales).pipe(
    timeout(limite),
    retry({
      count: peticion.method === 'GET' ? REINTENTOS_LECTURA : 0,
      delay: (error, intento) =>
        esTransitorio(error) ? timer(500 * 2 ** (intento - 1)) : throwError(() => error),
    }),
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
