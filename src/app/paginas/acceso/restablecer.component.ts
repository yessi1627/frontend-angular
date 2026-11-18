import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { fuerzaClave } from '../../core/funcional/clave';
import { aResultado } from '../../core/funcional/resultado';
import { RecuperacionService } from '../../core/servicios/recuperacion.service';
import { PanelAccesoComponent } from './panel-acceso.component';

// Paso 2 de la recuperacion: crear la contraseña nueva con el token del enlace
@Component({
  selector: 'app-restablecer',
  imports: [ReactiveFormsModule, RouterLink, PanelAccesoComponent],
  template: `
    <app-panel-acceso>
      <h1 class="acceso-titulo">Nueva contraseña</h1>
      <p class="acceso-texto">Crea una contraseña segura de al menos 6 caracteres.</p>

      @if (!token()) {
        <div class="acceso-aviso error" role="alert">
          <i class="bi bi-exclamation-circle"></i>
          <span>El enlace está incompleto. Solicite uno nuevo.</span>
        </div>
      } @else {
        @if (error()) {
          <div class="acceso-aviso error" role="alert">
            <i class="bi bi-exclamation-circle"></i><span>{{ error() }}</span>
          </div>
        }
        <form [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
          <div class="acceso-campo">
            <i class="bi bi-lock"></i>
            <input
              [type]="verClave() ? 'text' : 'password'"
              class="form-control"
              formControlName="password"
              placeholder="Contraseña nueva"
              aria-label="Contraseña nueva"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="acceso-ojo"
              (click)="verClave.set(!verClave())"
              [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <i class="bi" [class]="verClave() ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <div class="fuerza" [attr.data-nivel]="fuerza().nivel">
            <span>Fuerza de la contraseña</span>
            <div class="barras">
              @for (n of [1, 2, 3, 4]; track n) {
                <i [class.llena]="fuerza().nivel >= n"></i>
              }
            </div>
            <strong>{{ fuerza().texto }}</strong>
          </div>
          <div class="acceso-campo">
            <i class="bi bi-shield-lock"></i>
            <input
              [type]="verClave() ? 'text' : 'password'"
              class="form-control"
              formControlName="confirmacion"
              placeholder="Confirmar contraseña"
              aria-label="Confirmar contraseña"
              autocomplete="new-password"
            />
          </div>
          @if (noCoinciden()) {
            <div class="acceso-error">Las contraseñas no coinciden.</div>
          }
          <button type="submit" class="acceso-boton w-100 mt-2 mb-4" [disabled]="guardando()">
            @if (guardando()) {
              <span class="spinner-border spinner-border-sm"></span> Guardando…
            } @else {
              Guardar contraseña <i class="bi bi-check-lg"></i>
            }
          </button>
        </form>
      }

      <div class="text-center d-flex flex-column gap-2">
        <a routerLink="/recuperar" class="acceso-enlace align-self-center">Solicitar otro enlace</a>
        <a routerLink="/login" class="acceso-enlace align-self-center"
          ><i class="bi bi-arrow-left"></i> Volver a iniciar sesión</a
        >
      </div>
    </app-panel-acceso>
  `,
  styles: `
    .fuerza {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: -0.25rem 0 1rem 1.1rem;
      font-size: 0.8rem;
      color: #dbeafe;
    }
    .barras {
      display: flex;
      gap: 4px;
      flex: 1;
      max-width: 140px;
    }
    .barras i {
      flex: 1;
      height: 5px;
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.25);
    }
    .fuerza[data-nivel='1'] .llena {
      background: #f87171;
    }
    .fuerza[data-nivel='2'] .llena {
      background: #fbbf24;
    }
    .fuerza[data-nivel='3'] .llena {
      background: #a3e635;
    }
    .fuerza[data-nivel='4'] .llena {
      background: #34d399;
    }
    strong {
      min-width: 52px;
      color: #fff;
    }
  `,
})
export class RestablecerComponent {
  // Viene del enlace: /restablecer?token=... (withComponentInputBinding)
  readonly token = input<string>('');

  private readonly servicio = inject(RecuperacionService);
  private readonly router = inject(Router);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmacion: ['', Validators.required],
  });

  private readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });
  protected readonly fuerza = computed(() => fuerzaClave(this.valores().password ?? ''));
  protected readonly noCoinciden = computed(() => {
    const { password, confirmacion } = this.valores();
    return !!confirmacion && password !== confirmacion;
  });

  protected guardar(): void {
    const { password, confirmacion } = this.formulario.getRawValue();
    if (this.formulario.invalid || password !== confirmacion || this.guardando()) {
      this.formulario.markAllAsTouched();
      this.error.set(
        password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres.' : null,
      );
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.servicio
      .restablecer(this.token(), password, confirmacion)
      .pipe(
        aResultado(),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: () => {
            this.router.navigate(['/login'], { queryParams: { restablecida: 1 } });
          },
          fallo: (e) => this.error.set(Object.values(e.detalles)[0] ?? e.mensaje),
        }),
      );
  }
}
