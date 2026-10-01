import { Component, computed, input } from '@angular/core';

// Insignia de color segun el estado (Pendiente, Entregada, Vencida, etc.)
const TONOS: Readonly<Record<string, string>> = {
  Pendiente: 'tono-alerta',
  Completada: 'tono-exito',
  Entregada: 'tono-exito',
  Vencida: 'tono-peligro',
  'No entrego': 'tono-peligro',
  Aprobado: 'tono-exito',
  Reprobado: 'tono-peligro',
  ADMINISTRADOR: 'tono-primario',
  PROFESOR: 'tono-info',
  ESTUDIANTE: 'tono-exito',
};

// Texto que se muestra cuando el valor guardado en la base de datos no lleva tilde
const ETIQUETAS: Readonly<Record<string, string>> = {
  'No entrego': 'No entregó',
};

@Component({
  selector: 'app-insignia',
  template: `<span class="insignia" [class]="clase()">{{ etiqueta() }}</span>`,
})
export class InsigniaComponent {
  readonly texto = input.required<string>();
  protected readonly clase = computed(
    () => 'insignia ' + (TONOS[this.texto()] ?? 'insignia-neutra'),
  );
  protected readonly etiqueta = computed(() => ETIQUETAS[this.texto()] ?? this.texto());
}
