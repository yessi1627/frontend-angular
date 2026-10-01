import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { InsigniaComponent } from '../../compartido/insignia.component';
import { aFecha, fechaLarga, horaCorta, relativo } from '../../core/fechas';
import { aResultado } from '../../core/funcional/resultado';
import { Tarea } from '../../core/modelos';
import { MateriasService } from '../../core/servicios/materias.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { FiltroTareas, TareasService } from '../../core/servicios/tareas.service';

@Component({
  selector: 'app-tareas-lista',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InsigniaComponent,
    EstadoVacioComponent,
    CargandoFilasComponent,
  ],
  templateUrl: './tareas-lista.component.html',
  styleUrl: './tareas-lista.component.css',
})
export class TareasListaComponent {
  private readonly tareas = inject(TareasService);
  protected readonly sesion = inject(SesionService);
  protected readonly esEstudiante = computed(() => this.sesion.rol() === 'ESTUDIANTE');
  protected readonly fechaLarga = fechaLarga;
  protected readonly horaCorta = horaCorta;

  protected readonly busqueda = new FormControl('', { nonNullable: true });
  protected readonly materia = new FormControl<number | null>(null);
  protected readonly orden = new FormControl<FiltroTareas['orden']>('fecha_entrega', {
    nonNullable: true,
  });
  protected readonly buscando = signal(false);

  protected readonly materias = toSignal(inject(MateriasService).listar(), { initialValue: [] });

  /**
   * BUSCADOR REACTIVO
   *  - debounceTime(400): espera 400 ms despues de la ultima tecla; no se envia una peticion por letra.
   *    Es una forma de control de contrapresion (backpressure): descarta los eventos intermedios
   *    cuando el usuario escribe mas rapido de lo que conviene consultar al servidor.
   *  - distinctUntilChanged: si el texto final es igual al anterior (ej. escribe y borra), no consulta.
   *  - switchMap: si llega una busqueda nueva mientras la anterior sigue en curso, CANCELA la anterior;
   *    asi nunca se muestra el resultado viejo de una peticion lenta encima del nuevo.
   *  - aResultado: los errores se convierten en un valor Fallo y el buscador sigue funcionando.
   */
  private readonly texto$ = this.busqueda.valueChanges.pipe(
    debounceTime(400),
    map((texto) => texto.trim()),
    startWith(''),
    distinctUntilChanged(),
  );

  protected readonly resultado = toSignal(
    combineLatest([
      this.texto$,
      this.materia.valueChanges.pipe(startWith(null)),
      this.orden.valueChanges.pipe(startWith(this.orden.value)),
    ]).pipe(
      tap(() => this.buscando.set(true)),
      switchMap(([q, idMateria, orden]) =>
        this.tareas.listar({ q, id_materia: idMateria, orden }).pipe(aResultado()),
      ),
      tap(() => this.buscando.set(false)),
    ),
  );

  protected readonly lista = computed<readonly Tarea[]>(() => this.resultado()?.obtenerO([]) ?? []);
  protected readonly error = computed(
    () => this.resultado()?.coincidir({ ok: () => null, fallo: (e) => e.mensaje }) ?? null,
  );

  protected vence(t: Tarea): string {
    return relativo(aFecha(t.fecha_entrega, t.hora_entrega));
  }

  protected limpiar(): void {
    this.busqueda.setValue('');
    this.materia.setValue(null);
  }
}
