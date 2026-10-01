import { Component, inject } from '@angular/core';
import { AvisosService } from '../core/servicios/avisos.service';

const ICONOS = {
  exito: 'check-circle-fill',
  error: 'x-circle-fill',
  info: 'info-circle-fill',
  alerta: 'exclamation-triangle-fill',
};
const COLORES = {
  exito: 'var(--s-exito)',
  error: 'var(--s-peligro)',
  info: 'var(--s-primario)',
  alerta: 'var(--s-alerta)',
};

@Component({
  selector: 'app-avisos',
  template: `
    <div class="toasts" aria-live="polite">
      @for (aviso of avisos.avisos(); track aviso.id) {
        <div
          class="toast-siult"
          [class.exito]="aviso.tipo === 'exito'"
          [class.error]="aviso.tipo === 'error'"
          [class.aviso-t]="aviso.tipo === 'alerta'"
          role="status"
        >
          <i
            class="bi"
            [class]="'bi bi-' + iconos[aviso.tipo]"
            [style.color]="colores[aviso.tipo]"
          ></i>
          <span class="flex-grow-1">{{ aviso.mensaje }}</span>
          <button
            type="button"
            class="btn-close btn-sm"
            aria-label="Cerrar"
            (click)="avisos.cerrar(aviso.id)"
          ></button>
        </div>
      }
    </div>
  `,
})
export class AvisosComponent {
  protected readonly avisos = inject(AvisosService);
  protected readonly iconos = ICONOS;
  protected readonly colores = COLORES;
}
