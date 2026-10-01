import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Calificacion, PromedioEstudiante } from '../modelos';

export interface DatosCalificacion {
  readonly id_tarea: number;
  readonly id_usuario: number;
  readonly nota: number;
  readonly observacion: string | null;
}

@Injectable({ providedIn: 'root' })
export class CalificacionesService {
  private readonly api = inject(ApiService);

  listar(
    filtro: { id_tarea?: number; id_materia?: number | null } = {},
  ): Observable<readonly Calificacion[]> {
    return this.api.get<readonly Calificacion[]>('/calificaciones', { ...filtro });
  }

  guardar(datos: DatosCalificacion): Observable<Calificacion> {
    return this.api.post<Calificacion>('/calificaciones', datos);
  }

  promedios(idMateria?: number | null): Observable<readonly PromedioEstudiante[]> {
    return this.api.get<readonly PromedioEstudiante[]>('/calificaciones/promedios', {
      id_materia: idMateria,
    });
  }
}
