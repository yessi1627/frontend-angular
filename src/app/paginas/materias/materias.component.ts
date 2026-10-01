import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, filter, finalize, switchMap } from 'rxjs';
import { ConfirmacionService } from '../../compartido/confirmacion';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { Resultado, aResultado } from '../../core/funcional/resultado';
import { Materia } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { MateriasService } from '../../core/servicios/materias.service';
import { SesionService } from '../../core/servicios/sesion.service';

const COLORES = [
  '#1e3a8a',
  '#6366f1',
  '#0284c7',
  '#059669',
  '#d97706',
  '#db2777',
  '#7c3aed',
  '#0f766e',
];

@Component({
  selector: 'app-materias',
  imports: [FormsModule, RouterLink, EstadoVacioComponent, CargandoFilasComponent],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css',
})
export class MateriasComponent {
  private readonly servicio = inject(MateriasService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly sesion = inject(SesionService);
  protected readonly esAdmin = computed(() => this.sesion.rol() === 'ADMINISTRADOR');

  protected readonly resultado = signal<Resultado<readonly Materia[]> | null>(null);
  protected readonly materias = computed(() => this.resultado()?.obtenerO([]) ?? []);
  protected readonly editando = signal<Materia | null | 'nueva'>(null);
  protected readonly nombre = signal('');
  protected readonly guardando = signal(false);

  constructor() {
    this.cargar();
  }

  protected color(id: number): string {
    return COLORES[id % COLORES.length]!;
  }

  protected abrir(materia: Materia | 'nueva'): void {
    this.nombre.set(materia === 'nueva' ? '' : materia.nombre);
    this.editando.set(materia);
  }

  protected guardar(): void {
    const nombre = this.nombre().trim();
    const actual = this.editando();
    if (!nombre || !actual || this.guardando()) return;
    this.guardando.set(true);
    const peticion: Observable<Materia> =
      actual === 'nueva'
        ? this.servicio.crear(nombre)
        : this.servicio.actualizar(actual.id, nombre);
    peticion
      .pipe(
        aResultado(),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito(actual === 'nueva' ? 'Materia creada' : 'Materia actualizada');
            this.editando.set(null);
            this.cargar();
          },
          fallo: (e) => this.avisos.error(e.detalles['nombre_materia'] ?? e.mensaje),
        }),
      );
  }

  protected eliminar(materia: Materia): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar materia',
        mensaje: `¿Eliminar "${materia.nombre}"?`,
        textoConfirmar: 'Eliminar',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.servicio.eliminar(materia.id).pipe(aResultado())),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito('Materia eliminada');
            this.cargar();
          },
          fallo: (e) => this.avisos.error(e.mensaje),
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
