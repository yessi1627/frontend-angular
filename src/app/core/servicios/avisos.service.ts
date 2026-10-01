import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error' | 'info' | 'alerta';

export interface Aviso {
  readonly id: number;
  readonly tipo: TipoAviso;
  readonly mensaje: string;
}

// Avisos flotantes (toasts). La lista se reemplaza siempre por una nueva (inmutable).
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 1;
  readonly avisos = signal<readonly Aviso[]>([]);

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje, 6000);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  alerta(mensaje: string): void {
    this.mostrar('alerta', mensaje, 6000);
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((aviso) => aviso.id !== id));
  }

  private mostrar(tipo: TipoAviso, mensaje: string, duracionMs = 4000): void {
    const aviso: Aviso = { id: this.siguienteId++, tipo, mensaje };
    this.avisos.update((lista) => [...lista.slice(-3), aviso]);
    setTimeout(() => this.cerrar(aviso.id), duracionMs);
  }
}
