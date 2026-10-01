import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../modelos';

type Parametros = Record<string, string | number | boolean | null | undefined>;

// Cliente base de la API: todas las peticiones devuelven Observable y desenvuelven { data }
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(ruta: string, parametros: Parametros = {}): Observable<T> {
    return this.http
      .get<RespuestaApi<T>>(this.base + ruta, { params: this.aParams(parametros) })
      .pipe(map((r) => r.data));
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<RespuestaApi<T>>(this.base + ruta, cuerpo).pipe(map((r) => r.data));
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<RespuestaApi<T>>(this.base + ruta, cuerpo).pipe(map((r) => r.data));
  }

  delete<T = null>(ruta: string): Observable<T> {
    return this.http.delete<RespuestaApi<T>>(this.base + ruta).pipe(map((r) => r.data));
  }

  // Quito los parametros vacios para no enviar ?q=&id_materia=
  private aParams(parametros: Parametros): HttpParams {
    return Object.entries(parametros)
      .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
      .reduce((params, [clave, valor]) => params.set(clave, String(valor)), new HttpParams());
  }
}
