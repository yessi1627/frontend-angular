import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="estado-vacio">
      <div class="icono"><i class="bi" [class]="'bi bi-' + icono()"></i></div>
      <h3>{{ titulo() }}</h3>
      @if (texto()) {
        <p class="mb-3">{{ texto() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EstadoVacioComponent {
  readonly icono = input('inbox');
  readonly titulo = input.required<string>();
  readonly texto = input<string>('');
}

// Filas de carga con efecto de brillo mientras llega la informacion
@Component({
  selector: 'app-cargando-filas',
  template: `
    <div class="p-4 d-flex flex-column gap-3" aria-busy="true" aria-label="Cargando">
      @for (fila of filasArreglo(); track $index) {
        <div class="d-flex gap-3 align-items-center">
          <div class="esqueleto" style="width: 36px; height: 36px; border-radius: 50%"></div>
          <div class="flex-grow-1">
            <div class="esqueleto mb-2" style="height: 12px; width: 45%"></div>
            <div class="esqueleto" style="height: 10px; width: 70%"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CargandoFilasComponent {
  readonly filas = input(4);
  protected filasArreglo(): readonly number[] {
    return Array.from({ length: this.filas() }, (_, i) => i);
  }
}
