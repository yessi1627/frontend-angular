import { Component, Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, take } from 'rxjs';

interface Pregunta {
  readonly titulo: string;
  readonly mensaje: string;
  readonly textoConfirmar: string;
  readonly peligro: boolean;
}

// Dialogo de confirmacion propio. preguntar() devuelve un Observable que emite true o false.
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly pregunta = signal<Pregunta | null>(null);
  private respuesta$ = new Subject<boolean>();

  preguntar(opciones: Partial<Pregunta> & { mensaje: string }): Observable<boolean> {
    this.respuesta$ = new Subject<boolean>();
    this.pregunta.set({
      titulo: opciones.titulo ?? '¿Está seguro?',
      mensaje: opciones.mensaje,
      textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
      peligro: opciones.peligro ?? true,
    });
    return this.respuesta$.pipe(take(1));
  }

  responder(valor: boolean): void {
    this.pregunta.set(null);
    this.respuesta$.next(valor);
    this.respuesta$.complete();
  }
}

@Component({
  selector: 'app-confirmacion',
  template: `
    @if (servicio.pregunta(); as p) {
      <div
        class="modal-fondo"
        (click)="servicio.responder(false)"
        (keydown.escape)="servicio.responder(false)"
      >
        <div
          class="modal-caja"
          style="max-width: 420px"
          role="alertdialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-caja-cuerpo d-flex gap-3">
            <div
              class="indicador-icono"
              [class]="p.peligro ? 'indicador-icono tono-peligro' : 'indicador-icono tono-primario'"
            >
              <i
                class="bi"
                [class]="p.peligro ? 'bi bi-exclamation-triangle' : 'bi bi-question-circle'"
              ></i>
            </div>
            <div>
              <h2 class="h5 mb-1">{{ p.titulo }}</h2>
              <p class="texto-2 mb-0">{{ p.mensaje }}</p>
            </div>
          </div>
          <div class="modal-caja-pie">
            <button type="button" class="btn btn-suave" (click)="servicio.responder(false)">
              Cancelar
            </button>
            <button
              type="button"
              class="btn"
              [class]="p.peligro ? 'btn btn-danger' : 'btn btn-primary'"
              (click)="servicio.responder(true)"
              autofocus
            >
              {{ p.textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmacionComponent {
  protected readonly servicio = inject(ConfirmacionService);
}
