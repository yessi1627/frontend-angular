import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { NombreRol, Usuario } from '../modelos';

// Usuario autenticado. Lo guardo en un signal para que el menu y los guards reaccionen al cambio.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly api = inject(ApiService);
  private readonly usuarioActual = signal<Usuario | null>(null);

  readonly usuario = this.usuarioActual.asReadonly();
  readonly autenticado = computed(() => this.usuarioActual() !== null);
  readonly rol = computed(() => (this.usuarioActual()?.rol?.nombre ?? null) as NombreRol | null);
  readonly iniciales = computed(() =>
    (this.usuarioActual()?.nombres ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]!.toUpperCase())
      .join(''),
  );

  // Al abrir la app pregunto a la API si ya hay sesion (la cookie puede venir de las vistas PHP)
  restaurar(): Observable<boolean> {
    return this.api.get<Usuario>('/auth/me').pipe(
      tap((usuario) => this.usuarioActual.set(usuario)),
      map(() => true),
      catchError(() => {
        this.usuarioActual.set(null);
        return of(false);
      }),
    );
  }

  iniciarSesion(email: string, password: string): Observable<Usuario> {
    return this.api
      .post<Usuario>('/auth/login', { email, password })
      .pipe(tap((usuario) => this.usuarioActual.set(usuario)));
  }

  cerrarSesion(): Observable<null> {
    return this.api.post<null>('/auth/logout', {}).pipe(
      catchError(() => of(null)),
      tap(() => this.limpiar()),
    );
  }

  limpiar(): void {
    this.usuarioActual.set(null);
  }

  tieneRol(...roles: NombreRol[]): boolean {
    const actual = this.rol();
    return actual !== null && roles.includes(actual);
  }
}
