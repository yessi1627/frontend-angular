import { Injectable, inject } from '@angular/core';
import {
  EMPTY,
  Observable,
  Subscription,
  catchError,
  interval,
  retry,
  startWith,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';
import { Notificacion } from '../modelos';
import { Store } from './store';

interface EstadoNotificaciones {
  readonly lista: readonly Notificacion[];
  readonly ultimaVista: number;
  readonly sinConexion: boolean;
}

const CLAVE_VISTAS = 'siult-notificacion-vista';

/**
 * Notificaciones que se actualizan solas (polling reactivo):
 *  - interval(30 s) + startWith(0): pido las notificaciones al entrar y luego cada 30 segundos.
 *  - switchMap: si una peticion tarda y llega el siguiente tick, cancelo la anterior.
 *  - retry con espera exponencial (1 s, 2 s, 4 s): si falla la red, reintento 3 veces
 *    antes de rendirme en ese ciclo; el siguiente tick vuelve a intentar.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesStore extends Store<EstadoNotificaciones> {
  private readonly api = inject(ApiService);
  private suscripcion: Subscription | null = null;

  readonly lista$ = this.seleccionar((e) => e.lista);
  readonly sinConexion$ = this.seleccionar((e) => e.sinConexion);
  readonly noVistas$ = this.seleccionar((e) => e.lista.filter((n) => n.id > e.ultimaVista).length);

  constructor() {
    super({ lista: [], ultimaVista: NotificacionesStore.leerUltimaVista(), sinConexion: false });
  }

  iniciar(): void {
    if (this.suscripcion) return;
    this.suscripcion = interval(environment.intervaloNotificacionesMs)
      .pipe(
        startWith(0),
        switchMap(() => this.pedir()),
      )
      .subscribe((lista) => this.actualizar({ lista, sinConexion: false }));
  }

  detener(): void {
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
    this.actualizar({ lista: [] });
  }

  marcarVistas(): void {
    const mayor = this.estado.lista.reduce(
      (max, n) => Math.max(max, n.id),
      this.estado.ultimaVista,
    );
    this.actualizar({ ultimaVista: mayor });
    try {
      localStorage.setItem(CLAVE_VISTAS, String(mayor));
    } catch {
      // sin localStorage solo se pierde el contador al recargar
    }
  }

  private pedir(): Observable<readonly Notificacion[]> {
    return this.api.get<readonly Notificacion[]>('/notificaciones', { limite: 15 }).pipe(
      retry({ count: 3, delay: (_error, intento) => timer(1000 * 2 ** (intento - 1)) }),
      catchError(() => {
        this.actualizar({ sinConexion: true });
        return EMPTY;
      }),
      tap(() => this.estado.sinConexion && this.actualizar({ sinConexion: false })),
    );
  }

  private static leerUltimaVista(): number {
    try {
      return Number(localStorage.getItem(CLAVE_VISTAS) ?? 0) || 0;
    } catch {
      return 0;
    }
  }
}
