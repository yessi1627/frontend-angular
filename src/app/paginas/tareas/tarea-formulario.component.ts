import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { aResultado } from '../../core/funcional/resultado';
import { EstadoTarea } from '../../core/modelos';
import { AvisosService } from '../../core/servicios/avisos.service';
import { MateriasService } from '../../core/servicios/materias.service';
import { DatosTarea, TareasService } from '../../core/servicios/tareas.service';

@Component({
  selector: 'app-tarea-formulario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './tarea-formulario.component.html',
})
export class TareaFormularioComponent implements OnInit {
  // Si la ruta trae :id estoy editando; si no, creando
  readonly id = input<string>();

  private readonly tareas = inject(TareasService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  protected readonly materias = toSignal(inject(MateriasService).listar(), { initialValue: [] });
  protected readonly editando = computed(() => !!this.id());
  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly erroresApi = signal<Readonly<Record<string, string>>>({});
  protected readonly hoy = new Date().toISOString().slice(0, 10);
  protected readonly estados: readonly EstadoTarea[] = ['Pendiente', 'Completada', 'Vencida'];

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    id_materia: [0, [Validators.required, Validators.min(1)]],
    titulo: ['', [Validators.required, Validators.maxLength(255)]],
    descripcion: ['', [Validators.required, Validators.maxLength(5000)]],
    fecha_entrega: ['', Validators.required],
    hora_entrega: ['23:59', Validators.required],
    estado: ['Pendiente' as EstadoTarea],
  });

  ngOnInit(): void {
    const id = Number(this.id());
    if (!id) return;
    this.cargando.set(true);
    this.tareas
      .obtener(id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (t) =>
          this.formulario.patchValue({
            id_materia: t.materia?.id ?? 0,
            titulo: t.titulo,
            descripcion: t.descripcion,
            fecha_entrega: t.fecha_entrega,
            hora_entrega: t.hora_entrega.slice(0, 5),
            estado: t.estado,
          }),
        error: () => {
          this.avisos.error('No se pudo cargar la tarea');
          this.router.navigate(['/tareas']);
        },
      });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return (control.touched && control.invalid) || !!this.erroresApi()[campo];
  }

  protected guardar(): void {
    if (this.formulario.invalid || this.guardando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.erroresApi.set({});
    const valores = this.formulario.getRawValue();
    const datos: DatosTarea = this.editando() ? valores : { ...valores, estado: undefined };
    const peticion = this.editando()
      ? this.tareas.actualizar(Number(this.id()), datos)
      : this.tareas.crear(datos);

    peticion
      .pipe(
        aResultado(),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: (tarea) => {
            this.avisos.exito(
              this.editando() ? 'Tarea actualizada' : 'Tarea creada; se notificó a los estudiantes',
            );
            this.router.navigate(['/tareas', tarea.id]);
          },
          fallo: (e) => {
            this.erroresApi.set(e.detalles);
            this.avisos.error(e.mensaje);
          },
        }),
      );
  }
}
