import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';
import { Entrega, EstadoTarea, RespuestaApi, Tarea, TareaDetalle } from '../modelos';

export interface FiltroTareas {
  readonly q?: string;
  readonly id_materia?: number | null;
  readonly orden?: 'fecha_entrega' | 'titulo' | 'estado';
}

export interface DatosTarea {
  readonly id_materia: number;
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha_entrega: string;
  readonly hora_entrega: string;
  readonly estado?: EstadoTarea;
}

@Injectable({ providedIn: 'root' })
export class TareasService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  listar(filtro: FiltroTareas = {}): Observable<readonly Tarea[]> {
    return this.api.get<readonly Tarea[]>('/tareas', { ...filtro });
  }

  obtener(id: number): Observable<TareaDetalle> {
    return this.api.get<TareaDetalle>(`/tareas/${id}`);
  }

  crear(datos: DatosTarea): Observable<Tarea> {
    return this.api.post<Tarea>('/tareas', datos);
  }

  actualizar(id: number, datos: DatosTarea): Observable<Tarea> {
    return this.api.put<Tarea>(`/tareas/${id}`, datos);
  }

  eliminar(id: number): Observable<null> {
    return this.api.delete(`/tareas/${id}`);
  }

  // La entrega va como multipart/form-data porque incluye el archivo
  entregar(idTarea: number, archivo: File): Observable<Entrega> {
    const formulario = new FormData();
    formulario.append('id_tarea', String(idTarea));
    formulario.append('archivo', archivo, archivo.name);
    return this.http
      .post<RespuestaApi<Entrega>>(`${environment.apiUrl}/entregas`, formulario)
      .pipe(map((r) => r.data));
  }
}
