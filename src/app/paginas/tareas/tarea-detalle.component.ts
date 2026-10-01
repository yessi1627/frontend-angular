import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { ConfirmacionService } from '../../compartido/confirmacion';
import { EstadoVacioComponent } from '../../compartido/estado-vacio.component';
import { InsigniaComponent } from '../../compartido/insignia.component';
import { CalificacionesStore } from '../../core/estado/calificaciones.store';
import { aFecha, fechaLarga, horaCorta, relativo, relativoDesdeTexto } from '../../core/fechas';
import { resumen, tonoNota } from '../../core/funcional/notas';
import { Resultado, aResultado } from '../../core/funcional/resultado';
import { TareaDetalle } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { TareasService } from '../../core/servicios/tareas.service';
import { environment } from '../../../environments/environment';
import { CalificarComponent } from './calificar.component';

@Component({
  selector: 'app-tarea-detalle',
  imports: [RouterLink, InsigniaComponent, EstadoVacioComponent, CalificarComponent],
  templateUrl: './tarea-detalle.component.html',
  styleUrl: './tarea-detalle.component.css',
})
export class TareaDetalleComponent {
  // El id llega desde la ruta /tareas/:id gracias a withComponentInputBinding
  readonly id = input.required<string>();

  private readonly tareas = inject(TareasService);
  private readonly calificaciones = inject(CalificacionesStore);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);

  protected readonly uploads = environment.uploadsUrl;
  protected readonly fechaLarga = fechaLarga;
  protected readonly horaCorta = horaCorta;
  protected readonly relativoTexto = relativoDesdeTexto;
  protected readonly tonoNota = tonoNota;
  protected readonly esEstudiante = computed(() => this.sesion.rol() === 'ESTUDIANTE');
  private readonly recargar = signal(0);
  protected readonly subiendo = signal(false);
  protected readonly archivoElegido = signal<File | null>(null);

  // Cada vez que cambia el id o pido recargar, vuelvo a consultar (switchMap cancela la anterior)
  protected readonly resultado = toSignal(
    toObservable(computed(() => ({ id: Number(this.id()), vez: this.recargar() }))).pipe(
      switchMap(({ id }) =>
        this.tareas.obtener(id).pipe(
          // Para el profesor cargo tambien las notas de esta tarea en el store compartido
          switchMap((t) =>
            this.esEstudiante()
              ? of(t)
              : this.calificaciones.cargar({ id_tarea: t.id }).pipe(
                  map(() => t),
                  catchError(() => of(t)),
                ),
          ),
          aResultado(),
        ),
      ),
    ),
  );

  protected readonly tarea = computed(
    () =>
      this.resultado()?.coincidir<TareaDetalle | null>({ ok: (t) => t, fallo: () => null }) ?? null,
  );

  // Notas de esta tarea desde el store: si se califica, la tabla y el resumen se actualizan solos
  protected readonly notas = toSignal(
    toObservable(computed(() => Number(this.id()))).pipe(
      switchMap((id) => this.calificaciones.deTarea(id)),
    ),
    { initialValue: new Map() },
  );

  protected readonly resumenCurso = computed(() =>
    resumen([...this.notas().values()].map((c) => c.nota)),
  );

  protected readonly abierta = computed(() => {
    const t = this.tarea();
    return t ? aFecha(t.fecha_entrega, t.hora_entrega) > new Date() : false;
  });

  protected readonly entregados = computed(
    () => this.tarea()?.estudiantes?.filter((e) => e.estado_entrega === 'Entregada').length ?? 0,
  );

  protected vence(t: TareaDetalle): string {
    return relativo(aFecha(t.fecha_entrega, t.hora_entrega));
  }

  protected errorDe(r: Resultado<TareaDetalle>): string | null {
    return r.coincidir({
      ok: () => null,
      fallo: (e) => (e.codigo === 404 ? 'La tarea no existe o no tienes acceso.' : e.mensaje),
    });
  }

  protected elegirArchivo(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    if (archivo && archivo.size > 5 * 1024 * 1024) {
      this.avisos.error('El archivo supera el máximo de 5 MB');
      return;
    }
    this.archivoElegido.set(archivo);
  }

  protected entregar(): void {
    const archivo = this.archivoElegido();
    const t = this.tarea();
    if (!archivo || !t || this.subiendo()) return;
    this.subiendo.set(true);
    this.tareas
      .entregar(t.id, archivo)
      .pipe(
        aResultado(),
        finalize(() => this.subiendo.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito('Tu entrega fue registrada');
            this.archivoElegido.set(null);
            this.recargar.update((v) => v + 1);
          },
          fallo: (e) => this.avisos.error(e.detalles['archivo'] ?? e.mensaje),
        }),
      );
  }

  protected eliminar(t: TareaDetalle): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar tarea',
        mensaje: `Se eliminará "${t.titulo}" junto con sus entregas y calificaciones. Esta acción no se puede deshacer.`,
        textoConfirmar: 'Eliminar',
      })
      .pipe(switchMap((si) => (si ? this.tareas.eliminar(t.id).pipe(aResultado()) : of(null))))
      .subscribe((r) => {
        if (!r) return;
        r.coincidir({
          ok: () => {
            this.avisos.exito('Tarea eliminada');
            this.router.navigate(['/tareas']);
          },
          fallo: (e) => this.avisos.error(e.mensaje),
        });
      });
  }
}
