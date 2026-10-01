import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { agregarBloque, combinar } from '../../core/funcional/estadisticas';
import { tonoNota } from '../../core/funcional/notas';
import {
  EstadisticasParalelasService,
  ResultadoParalelo,
} from '../../core/trabajo/estadisticas-paralelas.service';

const NOTAS_SIMULADAS = 2_000_000;

// Estadisticas del curso calculadas en paralelo con Web Workers (Unidad 2: paralelismo y particionamiento)
@Component({
  selector: 'app-estadisticas-curso',
  templateUrl: './estadisticas-curso.component.html',
  styleUrl: './estadisticas-curso.component.css',
})
export class EstadisticasCursoComponent {
  readonly notas = input.required<readonly number[]>();

  private readonly paralelo = inject(EstadisticasParalelasService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly tonoNota = tonoNota;
  protected readonly simuladas = NOTAS_SIMULADAS;

  protected readonly resultado = signal<ResultadoParalelo | null>(null);
  protected readonly origen = signal<'reales' | 'simuladas'>('reales');
  protected readonly calculando = signal(false);
  protected readonly msHiloPrincipal = signal<number | null>(null);
  // Contador que avanza en cada cuadro de animacion: si sigue avanzando mientras se calcula,
  // la interfaz no esta bloqueada
  protected readonly cuadros = signal(0);
  private animacion = 0;

  constructor() {
    // Recalculo automaticamente cuando cambian las notas reales del curso
    effect(() => {
      const notas = this.notas();
      untracked(() => this.calcular(notas, 'reales'));
    });
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.animacion));
  }

  protected simular(): void {
    // Genero datos de prueba; el calculo pesado lo hacen los workers
    const datos = Array.from(
      { length: NOTAS_SIMULADAS },
      () => Math.round(Math.random() * 50) / 10,
    );
    this.msHiloPrincipal.set(null);
    this.calcular(datos, 'simuladas', () => {
      // Para comparar: el mismo calculo en el hilo de la interfaz (sin workers)
      const inicio = performance.now();
      combinar([agregarBloque(datos)]);
      this.msHiloPrincipal.set(Math.round(performance.now() - inicio));
    });
  }

  protected usarReales(): void {
    this.msHiloPrincipal.set(null);
    this.calcular(this.notas(), 'reales');
  }

  private calcular(
    datos: readonly number[],
    origen: 'reales' | 'simuladas',
    despues?: () => void,
  ): void {
    this.calculando.set(true);
    this.origen.set(origen);
    this.iniciarPulso();
    this.paralelo.calcular(datos).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.calculando.set(false);
        cancelAnimationFrame(this.animacion);
        despues?.();
      },
      error: () => {
        this.calculando.set(false);
        cancelAnimationFrame(this.animacion);
      },
    });
  }

  private iniciarPulso(): void {
    cancelAnimationFrame(this.animacion);
    const paso = () => {
      this.cuadros.update((v) => v + 1);
      this.animacion = requestAnimationFrame(paso);
    };
    this.animacion = requestAnimationFrame(paso);
  }

  protected alturaBarra(valor: number, r: ResultadoParalelo): number {
    const mayor = Math.max(1, ...r.estadisticas.histograma);
    return (valor / mayor) * 100;
  }
}
