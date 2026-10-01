import { Injectable } from '@angular/core';
import { Observable, defer, forkJoin, map, of } from 'rxjs';
import {
  Estadisticas,
  Parcial,
  agregarBloque,
  combinar,
  particionar,
} from '../funcional/estadisticas';

export interface ResultadoParalelo {
  readonly estadisticas: Estadisticas;
  readonly hilos: number;
  readonly milisegundos: number;
  readonly tiemposPorHilo: readonly number[];
}

/**
 * PARALELISMO con Web Workers y PARTICIONAMIENTO de datos:
 *  1. Divido las notas en tantos bloques como nucleos tenga el equipo (maximo 4).
 *  2. Cada bloque va a su propio Web Worker; los workers trabajan al mismo tiempo en hilos distintos.
 *  3. forkJoin espera a que TODOS terminen y combino los resultados parciales.
 * El hilo principal (el de la interfaz) no hace el calculo pesado, por eso la pantalla no se congela.
 */
@Injectable({ providedIn: 'root' })
export class EstadisticasParalelasService {
  calcular(notas: readonly number[]): Observable<ResultadoParalelo> {
    return defer(() => {
      const inicio = performance.now();
      const hilos = Math.max(1, Math.min(navigator.hardwareConcurrency || 2, 4));
      const bloques = particionar(notas, hilos);

      // Sin soporte de workers (por ejemplo en pruebas), calculo en el hilo principal
      const trabajos: Observable<{ parcial: Parcial; ms: number }>[] =
        typeof Worker === 'undefined'
          ? bloques.map((b) => of({ parcial: agregarBloque(b), ms: 0 }))
          : bloques.map((b) => this.enWorker(b));

      return forkJoin(trabajos).pipe(
        map((resultados) => ({
          estadisticas: combinar(resultados.map((r) => r.parcial)),
          hilos: bloques.length,
          milisegundos: Math.round(performance.now() - inicio),
          tiemposPorHilo: resultados.map((r) => Math.round(r.ms)),
        })),
      );
    });
  }

  // Envio un bloque a un worker nuevo y lo cierro al recibir la respuesta
  private enWorker(bloque: readonly number[]): Observable<{ parcial: Parcial; ms: number }> {
    return new Observable((suscriptor) => {
      const worker = new Worker(new URL('./estadisticas.worker', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = ({ data }) => {
        suscriptor.next(data);
        suscriptor.complete();
      };
      worker.onerror = (error) => suscriptor.error(error);
      // Float64Array se transfiere sin copiar (transferable): el envio es casi instantaneo
      const datos = Float64Array.from(bloque);
      worker.postMessage(datos, [datos.buffer]);
      return () => worker.terminate();
    });
  }
}
