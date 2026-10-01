import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Calificacion } from '../modelos';
import { CalificacionesService, DatosCalificacion } from '../servicios/calificaciones.service';
import { Store } from './store';

interface EstadoCalificaciones {
  readonly calificaciones: readonly Calificacion[];
  readonly cargando: boolean;
}

/**
 * Estado compartido de las calificaciones. Cuando el profesor guarda una nota, el store
 * reemplaza la lista por una nueva y TODAS las pantallas suscritas (detalle de la tarea,
 * calificaciones, panel) muestran la nota nueva al mismo tiempo, sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class CalificacionesStore extends Store<EstadoCalificaciones> {
  private readonly servicio = inject(CalificacionesService);

  readonly calificaciones$ = this.seleccionar((e) => e.calificaciones);
  readonly cargando$ = this.seleccionar((e) => e.cargando);

  constructor() {
    super({ calificaciones: [], cargando: false });
  }

  cargar(
    filtro: { id_tarea?: number; id_materia?: number | null } = {},
  ): Observable<readonly Calificacion[]> {
    this.actualizar({ cargando: true });
    return this.servicio.listar(filtro).pipe(
      tap({
        next: (lista) =>
          this.actualizar((anterior) => ({
            calificaciones: this.combinar(anterior.calificaciones, lista),
            cargando: false,
          })),
        error: () => this.actualizar({ cargando: false }),
      }),
    );
  }

  // Notas de una tarea, como mapa id_usuario -> calificacion
  deTarea(idTarea: number): Observable<ReadonlyMap<number, Calificacion>> {
    return this.seleccionar(
      (e) =>
        new Map(
          e.calificaciones.filter((c) => c.id_tarea === idTarea).map((c) => [c.id_usuario, c]),
        ),
    );
  }

  guardar(datos: DatosCalificacion): Observable<Calificacion> {
    return this.servicio.guardar(datos).pipe(
      tap((nueva) =>
        this.actualizar((anterior) => ({
          calificaciones: this.combinar(anterior.calificaciones, [nueva]),
        })),
      ),
    );
  }

  // Combino sin mutar: las nuevas reemplazan a las que tienen el mismo (tarea, estudiante)
  private combinar(
    actuales: readonly Calificacion[],
    nuevas: readonly Calificacion[],
  ): readonly Calificacion[] {
    const clave = (c: Calificacion) => `${c.id_tarea}-${c.id_usuario}`;
    const clavesNuevas = new Set(nuevas.map(clave));
    return [...actuales.filter((c) => !clavesNuevas.has(clave(c))), ...nuevas];
  }
}
