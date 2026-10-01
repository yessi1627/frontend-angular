/// <reference lib="webworker" />
import { agregarBloque } from '../funcional/estadisticas';

// Este codigo corre en un HILO SEPARADO del navegador (Web Worker): mientras calcula,
// la pantalla sigue respondiendo. Recibe un bloque de notas y devuelve su resumen parcial.
addEventListener('message', ({ data }: MessageEvent<Float64Array>) => {
  const inicio = performance.now();
  const parcial = agregarBloque(Array.from(data));
  postMessage({ parcial, ms: performance.now() - inicio });
});
