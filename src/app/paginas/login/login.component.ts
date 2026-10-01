import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { aErrorApi } from '../../core/funcional/resultado';
import { SesionService } from '../../core/servicios/sesion.service';
import { TemaService } from '../../core/servicios/tema.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  protected readonly tema = inject(TemaService);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(
    this.ruta.snapshot.queryParamMap.has('expirada') ? 'Su sesión expiró. Ingrese de nuevo.' : null,
  );
  protected readonly verClave = signal(false);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected ingresar(): void {
    if (this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const { email, password } = this.formulario.getRawValue();
    this.sesion.iniciarSesion(email, password).subscribe({
      next: () => {
        const volver = this.ruta.snapshot.queryParamMap.get('volver');
        this.router.navigateByUrl(volver && volver.startsWith('/') ? volver : '/inicio');
      },
      error: (e: unknown) => {
        this.error.set(aErrorApi(e).mensaje);
        this.enviando.set(false);
      },
    });
  }
}
