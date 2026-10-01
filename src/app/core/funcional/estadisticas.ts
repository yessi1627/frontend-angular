/**
 * Estadisticas del curso con PARTICIONAMIENTO DE DATOS (estilo map-reduce).
 *
 * 1. particionar: divido la lista de notas en N bloques de tamaño parecido.
 * 2. agregarBloque ("map"): cada bloque se resume por separado en un Parcial. Como un bloque no
 *    depende de los demas, cada uno puede procesarse en un hilo distinto (Web Worker) en paralelo.
 * 3. combinar ("reduce"): uno los parciales en el resultado final. Sumas, conteos, minimos y maximos
 *    son asociativos, por eso el resultado es el mismo sin importar como se partieron los datos.
 *
 * Todas son funciones puras: no modifican los arreglos que reciben.
 */

export interface Parcial {
  readonly cantidad: number;
  readonly suma: number;
  readonly sumaCuadrados: number;
  readonly minima: number;
  readonly maxima: number;
  readonly aprobadas: number;
  readonly histograma: readonly number[];
}

export interface Estadisticas {
  readonly cantidad: number;
  readonly promedio: number | null;
  readonly desviacion: number | null;
  readonly minima: number | null;
  readonly maxima: number | null;
  readonly porcentajeAprobadas: number | null;
  readonly histograma: readonly number[];
}

const NOTA_MINIMA = 3.0;
const PARCIAL_VACIO: Parcial = Object.freeze({
  cantidad: 0,
  suma: 0,
  sumaCuadrados: 0,
  minima: Number.POSITIVE_INFINITY,
  maxima: Number.NEGATIVE_INFINITY,
  aprobadas: 0,
  histograma: [0, 0, 0, 0, 0],
});

// Divido en `bloques` partes contiguas; la ultima puede quedar un poco mas corta
export const particionar = <T>(datos: readonly T[], bloques: number): readonly (readonly T[])[] => {
  const n = Math.max(1, Math.min(bloques, datos.length || 1));
  const tamano = Math.ceil(datos.length / n);
  return Array.from({ length: n }, (_, i) => datos.slice(i * tamano, (i + 1) * tamano)).filter(
    (bloque) => bloque.length > 0,
  );
};

// "map": resumo un bloque. Uso un ciclo con acumuladores locales porque el bloque puede tener
// cientos de miles de notas; las variables son locales a la funcion, asi que sigue siendo pura.
export const agregarBloque = (notas: readonly number[]): Parcial => {
  let cantidad = 0;
  let suma = 0;
  let sumaCuadrados = 0;
  let minima = Number.POSITIVE_INFINITY;
  let maxima = Number.NEGATIVE_INFINITY;
  let aprobadas = 0;
  const histograma = [0, 0, 0, 0, 0];
  for (const nota of notas) {
    if (!Number.isFinite(nota) || nota < 0 || nota > 5) continue;
    cantidad++;
    suma += nota;
    sumaCuadrados += nota * nota;
    if (nota < minima) minima = nota;
    if (nota > maxima) maxima = nota;
    if (nota >= NOTA_MINIMA) aprobadas++;
    histograma[Math.min(Math.floor(nota), 4)]!++;
  }
  return { cantidad, suma, sumaCuadrados, minima, maxima, aprobadas, histograma };
};

// "reduce": combino dos parciales en uno nuevo
export const unirParciales = (a: Parcial, b: Parcial): Parcial => ({
  cantidad: a.cantidad + b.cantidad,
  suma: a.suma + b.suma,
  sumaCuadrados: a.sumaCuadrados + b.sumaCuadrados,
  minima: Math.min(a.minima, b.minima),
  maxima: Math.max(a.maxima, b.maxima),
  aprobadas: a.aprobadas + b.aprobadas,
  histograma: a.histograma.map((valor, i) => valor + (b.histograma[i] ?? 0)),
});

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

export const combinar = (parciales: readonly Parcial[]): Estadisticas => {
  const total = parciales.reduce(unirParciales, PARCIAL_VACIO);
  if (total.cantidad === 0) {
    return {
      cantidad: 0,
      promedio: null,
      desviacion: null,
      minima: null,
      maxima: null,
      porcentajeAprobadas: null,
      histograma: total.histograma,
    };
  }
  const promedio = total.suma / total.cantidad;
  const varianza = Math.max(0, total.sumaCuadrados / total.cantidad - promedio * promedio);
  return {
    cantidad: total.cantidad,
    promedio: redondear(promedio),
    desviacion: redondear(Math.sqrt(varianza)),
    minima: total.minima,
    maxima: total.maxima,
    porcentajeAprobadas: redondear((total.aprobadas / total.cantidad) * 100),
    histograma: total.histograma,
  };
};
