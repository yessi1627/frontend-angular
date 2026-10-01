import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, exhaustMap, finalize, tap } from 'rxjs';
import { CalificacionesStore } from '../../core/estado/calificaciones.store';
import { aResultado } from '../../core/funcional/resultado';
import { Calificacion } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';

// Formulario en linea para que el profesor califique a un estudiante en una tarea
@Component({
  selector: 'app-calificar',
  imports: [FormsModule],
  template: `
    <form class="calificar" (ngSubmit)="clicGuardar$.next()">
      <input
        type="number"
        class="form-control form-control-sm nota"
        name="nota"
        min="0"
        max="5"
        step="0.1"
        placeholder="0.0"
        [ngModel]="nota()"
        (ngModelChange)="nota.set($event)"
        aria-label="Nota"
        [class.is-invalid]="notaInvalida()"
      />
      <input
        type="text"
        class="form-control form-control-sm"
        name="observacion"
        placeholder="Observación (opcional)"
        [ngModel]="observacion()"
        (ngModelChange)="observacion.set($event)"
        maxlength="2000"
        aria-label="Observación"
      />
      <button type="submit" class="btn btn-primary btn-sm" [disabled]="guardando()">
        @if (guardando()) {
          <span class="spinner-border spinner-border-sm"></span>
        } @else {
          <i class="bi bi-check-lg"></i>
        }
        <span class="d-none d-xl-inline">Guardar</span>
      </button>
    </form>
  `,
  styles: `
    .calificar {
      display: flex;
      gap: 0.4rem;
      min-width: 320px;
    }
    .nota {
      width: 78px;
      flex-shrink: 0;
    }
  `,
})
export class CalificarComponent implements OnInit {
  readonly idTarea = input.required<number>();
  readonly idUsuario = input.required<number>();
  readonly actual = input<Calificacion | null>(null);

  private readonly store = inject(CalificacionesStore);
  private readonly avisos = inject(AvisosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly nota = signal<number | null>(null);
  protected readonly observacion = signal('');
  protected readonly guardando = signal(false);
  protected readonly notaInvalida = signal(false);
  protected readonly clicGuardar$ = new Subject<void>();

  ngOnInit(): void {
    this.nota.set(this.actual()?.nota ?? null);
    this.observacion.set(this.actual()?.observacion ?? '');

    /**
     * BACKPRESSURE con exhaustMap: mientras la peticion de guardar esta en curso, IGNORA los clics
     * nuevos (no los encola ni cancela la peticion actual). Un doble clic produce una sola peticion,
     * se puede comprobar en la pestaña Network del navegador.
     * Comparacion: switchMap cancelaria la anterior; concatMap las encolaria y enviaria dos.
     */
    this.clicGuardar$
      .pipe(
        exhaustMap(() => {
          const nota = this.nota();
          const valida = nota !== null && nota >= 0 && nota <= 5;
          this.notaInvalida.set(!valida);
          if (!valida) return [];
          this.guardando.set(true);
          return this.store
            .guardar({
              id_tarea: this.idTarea(),
              id_usuario: this.idUsuario(),
              nota,
              observacion: this.observacion().trim() || null,
            })
            .pipe(
              aResultado(),
              tap((r) =>
                r.coincidir({
                  ok: (c) => this.avisos.exito(`Nota ${c.nota.toFixed(1)} guardada`),
                  fallo: (e) => this.avisos.error(e.mensaje),
                }),
              ),
              finalize(() => this.guardando.set(false)),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
