import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, filter, finalize, switchMap } from 'rxjs';
import { ConfirmacionService } from '../../compartido/confirmacion';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { Resultado, aResultado } from '../../core/funcional/resultado';
import { Rol } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { RolesService } from '../../core/servicios/usuarios.service';

// Roles que usa el codigo del sistema; no conviene renombrarlos ni eliminarlos
const ROLES_DEL_SISTEMA = ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'];

@Component({
  selector: 'app-roles',
  imports: [FormsModule, EstadoVacioComponent, CargandoFilasComponent],
  template: `
    <div class="pagina-encabezado">
      <div>
        <h1>Roles</h1>
        <p>Perfiles de acceso al sistema.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="abrir('nuevo')">
        <i class="bi bi-plus-lg"></i> Nuevo rol
      </button>
    </div>

    <div class="tarjeta" style="max-width: 760px">
      @if (!resultado()) {
        <app-cargando-filas [filas]="3" />
      } @else {
        <table class="tabla">
          <thead>
            <tr>
              <th>Rol</th>
              <th>Usuarios</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of roles(); track r.id) {
              <tr>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="indicador-icono tono-primario"
                      style="width: 36px; height: 36px; font-size: 1rem"
                      ><i class="bi bi-shield-lock"></i
                    ></span>
                    <strong>{{ r.nombre }}</strong>
                    @if (esDelSistema(r)) {
                      <small class="insignia insignia-neutra">sistema</small>
                    }
                  </div>
                </td>
                <td class="texto-2">{{ r.cantidad_usuarios ?? 0 }}</td>
                <td>
                  <div class="tabla-acciones">
                    @if (!esDelSistema(r)) {
                      <button type="button" class="btn btn-icono" title="Editar" (click)="abrir(r)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-icono peligro"
                        title="Eliminar"
                        (click)="eliminar(r)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3"><app-estado-vacio icono="shield" titulo="No hay roles" /></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (editando(); as actual) {
      <div class="modal-fondo" (click)="editando.set(null)">
        <form
          class="modal-caja"
          (click)="$event.stopPropagation()"
          (ngSubmit)="guardar()"
          role="dialog"
          aria-modal="true"
        >
          <div class="modal-caja-cabecera">
            <h2>{{ actual === 'nuevo' ? 'Nuevo rol' : 'Editar rol' }}</h2>
            <button
              type="button"
              class="btn-close"
              aria-label="Cerrar"
              (click)="editando.set(null)"
            ></button>
          </div>
          <div class="modal-caja-cuerpo">
            <label class="form-label" for="rol">Nombre del rol</label>
            <input
              id="rol"
              name="rol"
              class="form-control text-uppercase"
              [ngModel]="nombre()"
              (ngModelChange)="nombre.set($event)"
              required
              maxlength="255"
              autofocus
            />
            <small class="texto-3">Se guardará en mayúsculas.</small>
          </div>
          <div class="modal-caja-pie">
            <button type="button" class="btn btn-suave" (click)="editando.set(null)">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!nombre().trim() || guardando()"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class RolesComponent {
  private readonly servicio = inject(RolesService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly resultado = signal<Resultado<readonly Rol[]> | null>(null);
  protected readonly roles = computed(() => this.resultado()?.obtenerO([]) ?? []);
  protected readonly editando = signal<Rol | 'nuevo' | null>(null);
  protected readonly nombre = signal('');
  protected readonly guardando = signal(false);

  constructor() {
    this.cargar();
  }

  protected esDelSistema(rol: Rol): boolean {
    return ROLES_DEL_SISTEMA.includes(rol.nombre);
  }

  protected abrir(rol: Rol | 'nuevo'): void {
    this.nombre.set(rol === 'nuevo' ? '' : rol.nombre);
    this.editando.set(rol);
  }

  protected guardar(): void {
    const actual = this.editando();
    const nombre = this.nombre().trim();
    if (!actual || !nombre || this.guardando()) return;
    this.guardando.set(true);
    const peticion: Observable<Rol> =
      actual === 'nuevo'
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
            this.avisos.exito('Rol guardado');
            this.editando.set(null);
            this.cargar();
          },
          fallo: (e) => this.avisos.error(e.mensaje),
        }),
      );
  }

  protected eliminar(rol: Rol): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar rol',
        mensaje: `¿Eliminar el rol ${rol.nombre}?`,
        textoConfirmar: 'Eliminar',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.servicio.eliminar(rol.id).pipe(aResultado())),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito('Rol eliminado');
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
