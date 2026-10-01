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
import { Notificacion } from '../modelos';
import { NotificacionesService } from '../servicios/microservicios.service';
import { Store } from './store';

interface EstadoNotificaciones {
  readonly lista: readonly Notificacion[];
  readonly sinConexion: boolean;
}

/**
 * Notificaciones que se actualizan solas (polling reactivo) desde el microservicio de notificaciones:
 *  - interval(30 s) + startWith(0): pido las notificaciones al entrar y luego cada 30 segundos.
 *  - switchMap: si una peticion tarda y llega el siguiente tick, cancelo la anterior.
 *  - retry con espera exponencial (1 s, 2 s, 4 s): si falla la red, reintento 3 veces
 *    antes de rendirme en ese ciclo; el siguiente tick vuelve a intentar.
 *  - Si el microservicio esta caido, la campana muestra "Reintentando…" y el resto de la
 *    aplicacion sigue funcionando (degradacion controlada).
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesStore extends Store<EstadoNotificaciones> {
  private readonly servicio = inject(NotificacionesService);
  private suscripcion: Subscription | null = null;

  readonly lista$ = this.seleccionar((e) => e.lista);
  readonly sinConexion$ = this.seleccionar((e) => e.sinConexion);
  readonly noVistas$ = this.seleccionar((e) => e.lista.filter((n) => !n.leida).length);

  constructor() {
    super({ lista: [], sinConexion: false });
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

  // Marco como leidas en la vista de inmediato (estado nuevo, sin mutar) y luego aviso al microservicio
  marcarVistas(): void {
    if (this.estado.lista.every((n) => n.leida)) return;
    this.actualizar((anterior) => ({ lista: anterior.lista.map((n) => ({ ...n, leida: true })) }));
    this.servicio
      .marcarTodasLeidas()
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  private pedir(): Observable<readonly Notificacion[]> {
    return this.servicio.listar(15).pipe(
      retry({ count: 3, delay: (_error, intento) => timer(1000 * 2 ** (intento - 1)) }),
      catchError(() => {
        this.actualizar({ sinConexion: true });
        return EMPTY;
      }),
      tap(() => this.estado.sinConexion && this.actualizar({ sinConexion: false })),
    );
  }
}
