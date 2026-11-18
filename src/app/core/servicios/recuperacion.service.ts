import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';

export interface RespuestaRecuperacion {
  readonly mensaje: string;
  // Solo en desarrollo, cuando no hay servidor de correo configurado
  readonly enlace_desarrollo?: string;
}

// Recuperacion de contraseña: pedir el enlace y crear la contraseña nueva
@Injectable({ providedIn: 'root' })
export class RecuperacionService {
  private readonly api = inject(ApiService);

  solicitar(email: string): Observable<RespuestaRecuperacion> {
    return this.api.post<RespuestaRecuperacion>('/auth/recuperar', { email });
  }

  restablecer(
    token: string,
    password: string,
    confirmacion: string,
  ): Observable<RespuestaRecuperacion> {
    return this.api.post<RespuestaRecuperacion>('/auth/restablecer', {
      token,
      password,
      password_confirmacion: confirmacion,
    });
  }
}
