import { Component, signal } from '@angular/core';

/**
 * Ilustracion de estudiantes en una biblioteca (SVG propio, no depende de internet).
 * Es interactiva: las capas se desplazan a distinta velocidad siguiendo el puntero (efecto parallax)
 * y algunos elementos flotan con animaciones CSS.
 */
@Component({
  selector: 'app-ilustracion-biblioteca',
  host: { '(pointermove)': 'mover($event)', '(pointerleave)': 'reiniciar()' },
  template: `
    <svg viewBox="0 0 480 400" role="img" aria-label="Estudiantes estudiando en una biblioteca">
      <!-- Fondo -->
      <g [style.transform]="capa(4)">
        <circle cx="250" cy="215" r="168" fill="#e0e7ff" />
        <circle cx="250" cy="215" r="128" fill="#eef2ff" />
      </g>

      <!-- Estanteria con libros -->
      <g [style.transform]="capa(8)">
        <rect x="58" y="96" width="150" height="214" rx="10" fill="#c7d2fe" />
        <rect x="68" y="106" width="130" height="194" rx="6" fill="#eef2ff" />
        @for (fila of [0, 1, 2]; track fila) {
          <rect x="68" [attr.y]="166 + fila * 64" width="130" height="6" fill="#a5b4fc" />
          @for (libro of libros; track $index) {
            <rect
              [attr.x]="74 + libro.x"
              [attr.y]="166 + fila * 64 - libro.alto"
              [attr.width]="libro.ancho"
              [attr.height]="libro.alto"
              rx="2"
              [attr.fill]="colores[($index + fila * 2) % colores.length]"
            />
          }
        }
      </g>

      <!-- Piso y sombras -->
      <ellipse cx="250" cy="352" rx="190" ry="14" fill="#c7d2fe" opacity="0.6" />

      <!-- Escritorio con portatil y estudiante sentada -->
      <g [style.transform]="capa(14)">
        <rect x="262" y="262" width="176" height="12" rx="6" fill="#1e3a8a" />
        <rect x="276" y="274" width="10" height="76" rx="4" fill="#1e3a8a" />
        <rect x="414" y="274" width="10" height="76" rx="4" fill="#1e3a8a" />
        <!-- portatil -->
        <path d="M300 220 h64 a4 4 0 0 1 4 4 v38 h-72 v-38 a4 4 0 0 1 4 -4z" fill="#334155" />
        <rect x="304" y="226" width="56" height="30" rx="2" fill="#93c5fd" />
        <rect x="310" y="232" width="30" height="4" rx="2" fill="#fff" />
        <rect x="310" y="240" width="40" height="4" rx="2" fill="#dbeafe" />
        <rect x="310" y="248" width="22" height="4" rx="2" fill="#dbeafe" />
        <rect x="286" y="260" width="94" height="5" rx="2" fill="#475569" />
        <!-- silla -->
        <rect x="378" y="250" width="12" height="70" rx="5" fill="#f59e0b" />
        <rect x="366" y="290" width="54" height="10" rx="5" fill="#f59e0b" />
        <!-- estudiante sentada -->
        <rect x="372" y="300" width="12" height="46" rx="5" fill="#1e293b" />
        <rect x="350" y="290" width="40" height="14" rx="7" fill="#1e293b" />
        <rect x="348" y="232" width="40" height="64" rx="16" fill="#2563eb" />
        <path
          d="M352 252 q-26 2 -40 6"
          stroke="#2563eb"
          stroke-width="11"
          stroke-linecap="round"
          fill="none"
        />
        <circle cx="309" cy="258" r="6" fill="#c68642" />
        <circle cx="368" cy="214" r="17" fill="#c68642" />
        <path d="M350 212 a19 19 0 0 1 37 -4 q-4 -16 -20 -16 q-18 0 -17 20z" fill="#1f2937" />
        <circle cx="386" cy="222" r="8" fill="#1f2937" />
      </g>

      <!-- Estudiante de pie con libro -->
      <g [style.transform]="capa(20)">
        <rect x="200" y="290" width="13" height="58" rx="5" fill="#1e3a8a" />
        <rect x="219" y="290" width="13" height="58" rx="5" fill="#1e3a8a" />
        <rect x="194" y="214" width="44" height="86" rx="18" fill="#f59e0b" />
        <rect
          x="200"
          y="244"
          width="36"
          height="28"
          rx="3"
          fill="#fff"
          transform="rotate(-8 218 258)"
        />
        <path d="M218 246 v24" stroke="#93c5fd" stroke-width="2" transform="rotate(-8 218 258)" />
        <path
          d="M205 252 h9 M205 258 h9 M223 250 h9 M223 256 h9"
          stroke="#bfdbfe"
          stroke-width="2"
          transform="rotate(-8 218 258)"
        />
        <circle cx="216" cy="190" r="20" fill="#f2c9a0" />
        <path d="M195 188 a21 21 0 0 1 42 -2 q-6 -20 -22 -20 q-20 0 -20 22z" fill="#7c2d12" />
        <path
          d="M197 186 q-2 26 6 40"
          stroke="#7c2d12"
          stroke-width="7"
          stroke-linecap="round"
          fill="none"
        />
      </g>

      <!-- Elementos flotantes -->
      <g [style.transform]="capa(30)">
        <g class="flota">
          <path d="M392 78 l34 -14 l34 14 l-34 14z" fill="#1e3a8a" />
          <path d="M406 86 v14 q20 10 40 0 v-14 l-20 8z" fill="#1e40af" />
          <path d="M454 80 v20" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
          <circle cx="454" cy="102" r="4" fill="#f59e0b" />
        </g>
        <g class="flota lenta">
          <rect
            x="84"
            y="40"
            width="54"
            height="38"
            rx="8"
            fill="#fff"
            stroke="#c7d2fe"
            stroke-width="2"
          />
          <path
            d="M98 59 l8 8 l16 -16"
            stroke="#10b981"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </g>
        <g class="flota rapida">
          <circle cx="300" cy="64" r="16" fill="#fde68a" />
          <path
            d="M294 82 h12 M296 88 h8"
            stroke="#f59e0b"
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
        <circle class="brilla" cx="160" cy="330" r="5" fill="#6366f1" />
        <circle class="brilla lenta" cx="446" cy="200" r="4" fill="#f59e0b" />
        <circle class="brilla rapida" cx="40" cy="220" r="4" fill="#3b82f6" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    svg {
      width: 100%;
      height: auto;
      overflow: visible;
    }
    g {
      transition: transform 0.25s ease-out;
    }
    .flota {
      animation: flotar 4s ease-in-out infinite;
    }
    .lenta {
      animation-duration: 5.5s;
    }
    .rapida {
      animation-duration: 3s;
    }
    .brilla {
      animation: brillar 2.4s ease-in-out infinite;
    }
    @keyframes flotar {
      50% {
        transform: translateY(-9px);
      }
    }
    @keyframes brillar {
      50% {
        opacity: 0.3;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .flota,
      .brilla {
        animation: none;
      }
      g {
        transition: none;
      }
    }
  `,
})
export class IlustracionBibliotecaComponent {
  protected readonly colores = ['#3b82f6', '#f59e0b', '#6366f1', '#10b981', '#ef4444', '#1e3a8a'];
  protected readonly libros = [
    { x: 0, ancho: 12, alto: 44 },
    { x: 14, ancho: 10, alto: 50 },
    { x: 26, ancho: 14, alto: 40 },
    { x: 42, ancho: 9, alto: 52 },
    { x: 54, ancho: 13, alto: 46 },
    { x: 70, ancho: 11, alto: 38 },
    { x: 84, ancho: 15, alto: 50 },
    { x: 102, ancho: 10, alto: 44 },
  ];
  // Posicion del puntero de -1 a 1 en cada eje
  private readonly puntero = signal({ x: 0, y: 0 });

  protected mover(evento: PointerEvent): void {
    const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.puntero.set({
      x: ((evento.clientX - caja.left) / caja.width) * 2 - 1,
      y: ((evento.clientY - caja.top) / caja.height) * 2 - 1,
    });
  }

  protected reiniciar(): void {
    this.puntero.set({ x: 0, y: 0 });
  }

  // Las capas mas cercanas se mueven mas (profundidad en pixeles)
  protected capa(profundidad: number): string {
    const { x, y } = this.puntero();
    return `translate(${-x * profundidad}px, ${-y * profundidad}px)`;
  }
}
