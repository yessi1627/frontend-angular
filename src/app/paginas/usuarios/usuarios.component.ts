import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, finalize, switchMap } from 'rxjs';
import { ConfirmacionService } from '../../compartido/confirmacion';
import {
  CargandoFilasComponent,
  EstadoVacioComponent,
} from '../../compartido/estado-vacio.component';
import { InsigniaComponent } from '../../compartido/insignia.component';
import { Resultado, aResultado } from '../../core/funcional/resultado';
import { Usuario } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { DatosUsuario, RolesService, UsuariosService } from '../../core/servicios/usuarios.service';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, InsigniaComponent, EstadoVacioComponent, CargandoFilasComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  private readonly servicio = inject(UsuariosService);
  private readonly avisos = inject(AvisosService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly sesion = inject(SesionService);

  protected readonly roles = toSignal(inject(RolesService).listar(), { initialValue: [] });
  protected readonly resultado = signal<Resultado<readonly Usuario[]> | null>(null);
  protected readonly filtroTexto = signal('');
  protected readonly filtroRol = signal('');
  protected readonly editando = signal<Usuario | 'nuevo' | null>(null);
  protected readonly guardando = signal(false);
  protected readonly erroresApi = signal<Readonly<Record<string, string>>>({});

  // Filtro en memoria con funciones puras (filter) sobre la lista inmutable
  protected readonly usuarios = computed(() => {
    const texto = this.filtroTexto().trim().toLowerCase();
    const rol = this.filtroRol();
    return (this.resultado()?.obtenerO([]) ?? [])
      .filter((u) => !rol || u.rol?.nombre === rol)
      .filter(
        (u) =>
          !texto ||
          u.nombres.toLowerCase().includes(texto) ||
          u.email.toLowerCase().includes(texto),
      );
  });

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    rol_id: [0, [Validators.required, Validators.min(1)]],
    password: [''],
    password_confirmacion: [''],
  });

  constructor() {
    this.cargar();
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('');
  }

  protected abrir(usuario: Usuario | 'nuevo'): void {
    this.erroresApi.set({});
    this.formulario.reset({
      nombres: usuario === 'nuevo' ? '' : usuario.nombres,
      email: usuario === 'nuevo' ? '' : usuario.email,
      rol_id: usuario === 'nuevo' ? 0 : (usuario.rol?.id ?? 0),
      password: '',
      password_confirmacion: '',
    });
    this.editando.set(usuario);
  }

  protected guardar(): void {
    const actual = this.editando();
    const valores = this.formulario.getRawValue();
    const claveRequerida = actual === 'nuevo';
    if (
      this.formulario.invalid ||
      (claveRequerida && !valores.password) ||
      !actual ||
      this.guardando()
    ) {
      this.formulario.markAllAsTouched();
      if (claveRequerida && !valores.password)
        this.erroresApi.set({ password: 'La contraseña es obligatoria' });
      return;
    }
    if (valores.password !== valores.password_confirmacion) {
      this.erroresApi.set({ password_confirmacion: 'Las contraseñas no coinciden' });
      return;
    }
    const datos: DatosUsuario = valores.password
      ? valores
      : { ...valores, password: undefined, password_confirmacion: undefined };
    this.guardando.set(true);
    const peticion =
      actual === 'nuevo' ? this.servicio.crear(datos) : this.servicio.actualizar(actual.id, datos);
    peticion
      .pipe(
        aResultado(),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito(actual === 'nuevo' ? 'Usuario creado' : 'Usuario actualizado');
            this.editando.set(null);
            this.cargar();
          },
          fallo: (e) => {
            this.erroresApi.set(e.detalles);
            this.avisos.error(e.mensaje);
          },
        }),
      );
  }

  protected eliminar(usuario: Usuario): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar usuario',
        mensaje: `Se eliminará a ${usuario.nombres} y toda su información.`,
        textoConfirmar: 'Eliminar',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.servicio.eliminar(usuario.id).pipe(aResultado())),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.avisos.exito('Usuario eliminado');
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
