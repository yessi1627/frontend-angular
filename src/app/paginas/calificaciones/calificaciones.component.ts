import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, startWith, switchMap } from 'rxjs';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { InsigniaComponent } from '../../compartido/insignia.component';
import { CalificacionesStore } from '../../core/estado/calificaciones.store';
import { relativoDesdeTexto } from '../../core/fechas';
import { promedio, resumen, tonoNota } from '../../core/funcional/notas';
import { aResultado } from '../../core/funcional/resultado';
import { Calificacion } from '../../core/modelos';
import { CalificacionesService } from '../../core/servicios/calificaciones.service';
import { MateriasService } from '../../core/servicios/materias.service';
import { SesionService } from '../../core/servicios/sesion.service';

interface PromedioMateria {
  readonly materia: string;
  readonly promedio: number | null;
  readonly cantidad: number;
}

@Component({
  selector: 'app-calificaciones',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InsigniaComponent,
    EstadoVacioComponent,
    CargandoFilasComponent,
  ],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css',
})
export class CalificacionesComponent {
  private readonly sesion = inject(SesionService);
  private readonly servicio = inject(CalificacionesService);
  private readonly store = inject(CalificacionesStore);
  protected readonly esEstudiante = computed(() => this.sesion.rol() === 'ESTUDIANTE');
  protected readonly tonoNota = tonoNota;
  protected readonly relativo = relativoDesdeTexto;

  protected readonly materias = toSignal(inject(MateriasService).listar(), { initialValue: [] });
  protected readonly materia = new FormControl<number | null>(null);
  private readonly materia$ = this.materia.valueChanges.pipe(startWith(null));

  // Las notas salen del store compartido: si el profesor califica en otra pantalla, aqui se ven al instante
  protected readonly cargaNotas = toSignal(
    this.materia$.pipe(
      switchMap((idMateria) => this.store.cargar({ id_materia: idMateria }).pipe(aResultado())),
    ),
  );
  private readonly todasLasNotas = toSignal(this.store.calificaciones$, { initialValue: [] });
  private readonly idMateria = toSignal(this.materia$, { initialValue: null });

  protected readonly notas = computed<readonly Calificacion[]>(() => {
    const nombre = this.materias().find((m) => m.id === this.idMateria())?.nombre;
    return [...this.todasLasNotas()]
      .filter((c) => !nombre || c.materia === nombre)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  // Promedios por estudiante calculados en el backend con funciones puras (lib/funciones_notas.php).
  // Se recalculan cuando cambia la materia o cuando el store registra una nota nueva.
  protected readonly promedios = toSignal(
    toObservable(computed(() => ({ materia: this.idMateria(), notas: this.todasLasNotas() }))).pipe(
      switchMap(({ materia }) => this.servicio.promedios(materia).pipe(aResultado())),
      map((r) => r.obtenerO([])),
    ),
    { initialValue: [] },
  );

  // Resumen y promedio por materia calculados en el frontend con funciones puras (core/funcional/notas.ts)
  protected readonly resumenGeneral = computed(() => resumen(this.notas().map((c) => c.nota)));
  protected readonly porMateria = computed<readonly PromedioMateria[]>(() => {
    const grupos = this.notas().reduce<Readonly<Record<string, readonly number[]>>>(
      (acc, c) => ({
        ...acc,
        [c.materia ?? 'Sin materia']: [...(acc[c.materia ?? 'Sin materia'] ?? []), c.nota],
      }),
      {},
    );
    return Object.entries(grupos).map(([materia, notas]) => ({
      materia,
      promedio: promedio(notas),
      cantidad: notas.length,
    }));
  });
}
