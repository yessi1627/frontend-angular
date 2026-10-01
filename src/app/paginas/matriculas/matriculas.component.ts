import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { relativoDesdeTexto } from '../../core/fechas';
import { Resultado, aResultado } from '../../core/funcional/resultado';
import { Matricula } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { MateriasService, MatriculasService } from '../../core/servicios/materias.service';
import { UsuariosService } from '../../core/servicios/usuarios.service';

@Component({
  selector: 'app-matriculas',
  imports: [EstadoVacioComponent, CargandoFilasComponent],
  templateUrl: './matriculas.component.html',
  styleUrl: './matriculas.component.css',
})
export class MatriculasComponent {
  private readonly servicio = inject(MatriculasService);
  private readonly avisos = inject(AvisosService);
  protected readonly relativo = relativoDesdeTexto;

  protected readonly estudiantes = toSignal(inject(UsuariosService).listar('ESTUDIANTE'), {
    initialValue: [],
  });
  protected readonly materias = toSignal(inject(MateriasService).listar(), { initialValue: [] });
  protected readonly resultado = signal<Resultado<readonly Matricula[]> | null>(null);
  protected readonly estudiante = signal<number | null>(null);
  // Conjunto inmutable de materias marcadas: cada cambio crea un Set nuevo
  protected readonly seleccion = signal<ReadonlySet<number>>(new Set());
  protected readonly guardando = signal(false);

  protected readonly matriculas = computed(() => this.resultado()?.obtenerO([]) ?? []);
  // Materias en las que ya esta el estudiante elegido, para marcarlas como inscritas
  protected readonly yaMatriculado = computed(
    () =>
      new Set(
        this.matriculas()
          .filter((m) => m.estudiante?.id === this.estudiante())
          .map((m) => m.materia?.id),
      ),
  );
  protected readonly visibles = computed(() =>
    this.estudiante()
      ? this.matriculas().filter((m) => m.estudiante?.id === this.estudiante())
      : this.matriculas(),
  );

  constructor() {
    this.cargar();
  }

  protected elegirEstudiante(valor: string): void {
    this.estudiante.set(valor ? Number(valor) : null);
    this.seleccion.set(new Set());
  }

  protected alternar(id: number): void {
    this.seleccion.update((anterior) => {
      const nuevo = new Set(anterior);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  protected matricular(): void {
    const idEstudiante = this.estudiante();
    const materias = [...this.seleccion()];
    if (!idEstudiante || materias.length === 0 || this.guardando()) return;
    this.guardando.set(true);
    this.servicio
      .matricular(idEstudiante, materias)
      .pipe(
        aResultado(),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: (res) => {
            this.avisos.exito(
              `${res.matriculas_nuevas} matrícula(s) registrada(s)` +
                (res.ya_existian ? `, ${res.ya_existian} ya existían` : ''),
            );
            this.seleccion.set(new Set());
            this.cargar();
          },
          fallo: (e) => this.avisos.error(Object.values(e.detalles)[0] ?? e.mensaje),
        }),
      );
  }

  private cargar(): void {
    this.servicio
      .listar()
      .pipe(aResultado())
      .subscribe((r) => this.resultado.set(r));
  }
}
