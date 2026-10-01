import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Materia, Matricula, ResultadoMatricula } from '../modelos';

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly api = inject(ApiService);

  listar(): Observable<readonly Materia[]> {
    return this.api.get<readonly Materia[]>('/materias');
  }

  crear(nombre_materia: string): Observable<Materia> {
    return this.api.post<Materia>('/materias', { nombre_materia });
  }

  actualizar(id: number, nombre_materia: string): Observable<Materia> {
    return this.api.put<Materia>(`/materias/${id}`, { nombre_materia });
  }

  eliminar(id: number): Observable<null> {
    return this.api.delete(`/materias/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class MatriculasService {
  private readonly api = inject(ApiService);

  listar(idUsuario?: number): Observable<readonly Matricula[]> {
    return this.api.get<readonly Matricula[]>('/matriculas', { id_usuario: idUsuario });
  }

  matricular(idUsuario: number, idMaterias: readonly number[]): Observable<ResultadoMatricula> {
    return this.api.post<ResultadoMatricula>('/matriculas', {
      id_usuario: idUsuario,
      id_materias: idMaterias,
    });
  }
}
