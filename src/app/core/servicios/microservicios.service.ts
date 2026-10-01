import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Festivo, Notificacion, RespuestaApi } from '../modelos';

// Microservicio de notificaciones (Node + MongoDB), a traves del API Gateway
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.notificacionesUrl;

  listar(limite = 15): Observable<readonly Notificacion[]> {
    return this.http
      .get<RespuestaApi<readonly Notificacion[]>>(this.url, {
        params: new HttpParams().set('limite', limite),
      })
      .pipe(map((r) => r.data));
  }

  marcarTodasLeidas(): Observable<number> {
    return this.http
      .patch<RespuestaApi<{ actualizadas: number }>>(`${this.url}/leidas`, {})
      .pipe(map((r) => r.data.actualizadas));
  }
}

// Microservicio de calendario (festivos de Colombia con cache en Redis), a traves del API Gateway
@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly http = inject(HttpClient);

  esFestivo(fecha: string): Observable<Festivo> {
    return this.http
      .get<RespuestaApi<Festivo>>(`${environment.calendarioUrl}/es-festivo/${fecha}`)
      .pipe(map((r) => r.data));
  }
}
