import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  materia: string;
  ruta_archivo: string | null;
  fecha_entrega: string;
  hora_entrega: string;
  nota: number | null;
  observacion_calificacion: string | null;
}

interface TareasResponse {
  data: Tarea[];
}

const TAREAS_URL = 'http://localhost/proyectoGestorEscolar/config/controllers/tareas/list.php';

@Injectable({
  providedIn: 'root',
})
export class TareasService {
  constructor(private readonly http: HttpClient) {}

  obtenerTareas(orden: string = 'title'): Observable<Tarea[]> {
    return this.http
      .get<TareasResponse>(TAREAS_URL, {
        params: { order: orden },
        withCredentials: true,
      })
      .pipe(map((respuesta) => respuesta.data));
  }
}
