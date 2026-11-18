import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { aResultado } from '../../core/funcional/resultado';
import {
  RecuperacionService,
  RespuestaRecuperacion,
} from '../../core/servicios/recuperacion.service';
import { PanelAccesoComponent } from './panel-acceso.component';

// Paso 1 de la recuperacion: pedir el enlace con el correo
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, PanelAccesoComponent],
  template: `
    <app-panel-acceso>
      <h1 class="acceso-titulo">Recuperar contraseña</h1>
      <p class="acceso-texto">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </p>

      @if (respuesta(); as r) {
        <div class="acceso-aviso" role="status">
          <i class="bi bi-envelope-check"></i><span>{{ r.mensaje }}</span>
        </div>
        @if (tokenDesarrollo(r); as token) {
          <div class="acceso-aviso">
            <i class="bi bi-info-circle"></i>
            <span>
              Modo desarrollo: este equipo no tiene un servidor de correo configurado, así que el
              enlace se muestra aquí en lugar de enviarse.
            </span>
          </div>
          <a
            class="acceso-boton w-100 d-flex align-items-center justify-content-center gap-2 text-decoration-none mb-3"
            routerLink="/restablecer"
            [queryParams]="{ token }"
          >
            Abrir enlace de restablecimiento <i class="bi bi-arrow-right"></i>
          </a>
        }
      } @else {
        @if (error()) {
          <div class="acceso-aviso error" role="alert">
            <i class="bi bi-exclamation-circle"></i><span>{{ error() }}</span>
          </div>
        }
        <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
          <div class="acceso-campo">
            <i class="bi bi-envelope"></i>
            <input
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="Correo electrónico"
              aria-label="Correo electrónico"
              autocomplete="email"
              [class.is-invalid]="
                formulario.controls.email.touched && formulario.controls.email.invalid
              "
            />
          </div>
          @if (formulario.controls.email.touched && formulario.controls.email.invalid) {
            <div class="acceso-error">Escriba un correo válido.</div>
          }
          <button type="submit" class="acceso-boton w-100 mt-2 mb-4" [disabled]="enviando()">
            @if (enviando()) {
              <span class="spinner-border spinner-border-sm"></span> Enviando…
            } @else {
              Enviar enlace <i class="bi bi-send"></i>
            }
          </button>
        </form>
      }

      <div class="text-center">
        <a routerLink="/login" class="acceso-enlace"
          ><i class="bi bi-arrow-left"></i> Volver a iniciar sesión</a
        >
      </div>
    </app-panel-acceso>
  `,
})
export class RecuperarComponent {
  private readonly servicio = inject(RecuperacionService);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly respuesta = signal<RespuestaRecuperacion | null>(null);
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected enviar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.servicio
      .solicitar(this.formulario.getRawValue().email)
      .pipe(
        aResultado(),
        finalize(() => this.enviando.set(false)),
      )
      .subscribe((r) =>
        r.coincidir({
          ok: (respuesta) => this.respuesta.set(respuesta),
          fallo: (e) => this.error.set(e.mensaje),
        }),
      );
  }

  // Saco el token del enlace para navegar dentro de la aplicacion
  protected tokenDesarrollo(r: RespuestaRecuperacion): string | null {
    return r.enlace_desarrollo ? new URL(r.enlace_desarrollo).searchParams.get('token') : null;
  }
}
