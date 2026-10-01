import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NotificacionesStore } from '../core/estado/notificaciones.store';
import { relativoDesdeTexto } from '../core/fechas';

// Campana de notificaciones: muestra lo que entrega el polling reactivo del store
@Component({
  selector: 'app-campana',
  imports: [RouterLink],
  template: `
    <div class="position-relative">
      <button
        type="button"
        class="btn-icono btn position-relative"
        (click)="alternar()"
        [attr.aria-expanded]="abierta()"
        aria-label="Notificaciones"
      >
        <i class="bi bi-bell fs-5"></i>
        @if (noVistas() > 0) {
          <span class="contador">{{ noVistas() > 9 ? '9+' : noVistas() }}</span>
        }
      </button>
      @if (abierta()) {
        <div class="capa" (click)="abierta.set(false)"></div>
        <div class="panel tarjeta">
          <div class="tarjeta-titulo py-3">
            <h2>Notificaciones</h2>
            @if (sinConexion()) {
              <span class="small texto-3"><i class="bi bi-wifi-off"></i> Reintentando…</span>
            }
          </div>
          <div class="lista">
            @for (n of lista(); track n.id) {
              <a class="item" [routerLink]="['/tareas', n.id_tarea]" (click)="abierta.set(false)">
                <span class="punto tono-primario"><i class="bi bi-journal-text"></i></span>
                <span>
                  <span class="d-block">{{ n.mensaje }}</span>
                  <small class="texto-3">{{ relativo(n.fecha) }}</small>
                </span>
              </a>
            } @empty {
              <p class="texto-2 text-center py-4 mb-0">No hay notificaciones</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .contador {
      position: absolute;
      top: 0;
      right: 0;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      border-radius: 9px;
      background: var(--s-peligro);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .capa {
      position: fixed;
      inset: 0;
      z-index: 1040;
    }
    .panel {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: min(370px, 92vw);
      z-index: 1045;
      box-shadow: var(--s-sombra-alta);
    }
    .lista {
      max-height: 380px;
      overflow: auto;
    }
    .item {
      display: flex;
      gap: 0.75rem;
      padding: 0.8rem 1.25rem;
      text-decoration: none;
      color: var(--s-texto);
      font-size: 0.88rem;
      border-bottom: 1px solid var(--s-borde);
    }
    .item:hover {
      background: var(--s-superficie-2);
    }
    .punto {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 9px;
      flex-shrink: 0;
    }
  `,
})
export class CampanaComponent {
  private readonly store = inject(NotificacionesStore);
  protected readonly lista = toSignal(this.store.lista$, { initialValue: [] });
  protected readonly noVistas = toSignal(this.store.noVistas$, { initialValue: 0 });
  protected readonly sinConexion = toSignal(this.store.sinConexion$, { initialValue: false });
  protected readonly abierta = signal(false);
  protected readonly relativo = relativoDesdeTexto;

  protected alternar(): void {
    this.abierta.update((v) => !v);
    if (this.abierta()) {
      this.store.marcarVistas();
    }
  }
}
