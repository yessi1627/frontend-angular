import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map } from 'rxjs';
import { TemaService } from '../../core/servicios/tema.service';
import { IlustracionBibliotecaComponent } from './ilustracion-biblioteca.component';

const MENSAJES = [
  'Organiza tus tareas y entregas en un solo lugar.',
  'Recibe avisos al instante cuando hay algo nuevo.',
  'Consulta tus notas y promedios cuando quieras.',
] as const;

// Marco comun de las pantallas de acceso (login, recuperar y restablecer contraseña)
@Component({
  selector: 'app-panel-acceso',
  imports: [IlustracionBibliotecaComponent],
  templateUrl: './panel-acceso.component.html',
  styleUrl: './panel-acceso.component.css',
})
export class PanelAccesoComponent {
  protected readonly tema = inject(TemaService);
  protected readonly mensajes = MENSAJES;
  // Cambio el mensaje cada 4 segundos (flujo reactivo convertido en signal)
  protected readonly actual = toSignal(interval(4000).pipe(map((n) => (n + 1) % MENSAJES.length)), {
    initialValue: 0,
  });
}
