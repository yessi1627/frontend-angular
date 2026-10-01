import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';
const CLAVE = 'siult-tema';

// Modo claro / oscuro. Bootstrap 5.3 cambia sus colores con el atributo data-bs-theme
// y mis variables de styles.css tambien dependen de ese atributo.
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  readonly tema = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => {
      const tema = this.tema();
      this.documento.documentElement.setAttribute(
        'data-bs-theme',
        tema === 'oscuro' ? 'dark' : 'light',
      );
      try {
        localStorage.setItem(CLAVE, tema);
      } catch {
        // Si el navegador bloquea localStorage, el tema solo dura la sesion
      }
    });
  }

  alternar(): void {
    this.tema.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }

  private temaInicial(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch {
      // sin acceso a localStorage
    }
    return this.documento.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  }
}
