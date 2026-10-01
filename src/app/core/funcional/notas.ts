/**
 * Funciones puras para estadisticas de notas (equivalentes a lib/funciones_notas.php del backend).
 *
 * Son puras porque:
 *  - siempre devuelven lo mismo para la misma entrada,
 *  - no modifican el arreglo recibido (es `readonly`) ni variables externas,
 *  - no hacen peticiones HTTP ni tocan el DOM.
 * Se construyen con map, filter y reduce en lugar de ciclos que acumulan en variables.
 */

export const NOTA_MINIMA_APROBACION = 3.0;

export interface ResumenNotas {
  readonly cantidad: number;
  readonly promedio: number | null;
  readonly maxima: number | null;
  readonly minima: number | null;
  readonly aprobadas: number;
  readonly reprobadas: number;
  readonly aprueba: boolean;
}

const redondear = (valor: number, decimales = 2): number => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

export const notasValidas = (notas: readonly (number | null | undefined)[]): readonly number[] =>
  notas
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
    .filter((n) => n >= 0 && n <= 5);

export const suma = (notas: readonly number[]): number =>
  notasValidas(notas).reduce((acumulado, nota) => acumulado + nota, 0);

export const promedio = (notas: readonly number[]): number | null => {
  const validas = notasValidas(notas);
  return validas.length === 0 ? null : redondear(suma(validas) / validas.length);
};

export const notaMaxima = (notas: readonly number[]): number | null => {
  const validas = notasValidas(notas);
  return validas.length === 0 ? null : validas.reduce((max, n) => (n > max ? n : max));
};

export const notaMinima = (notas: readonly number[]): number | null => {
  const validas = notasValidas(notas);
  return validas.length === 0 ? null : validas.reduce((min, n) => (n < min ? n : min));
};

export const aprobadas = (
  notas: readonly number[],
  minimo = NOTA_MINIMA_APROBACION,
): readonly number[] => notasValidas(notas).filter((n) => n >= minimo);

export const resumen = (
  notas: readonly number[],
  minimo = NOTA_MINIMA_APROBACION,
): ResumenNotas => {
  const validas = notasValidas(notas);
  const prom = promedio(validas);
  const cantidadAprobadas = aprobadas(validas, minimo).length;
  return Object.freeze({
    cantidad: validas.length,
    promedio: prom,
    maxima: notaMaxima(validas),
    minima: notaMinima(validas),
    aprobadas: cantidadAprobadas,
    reprobadas: validas.length - cantidadAprobadas,
    aprueba: prom !== null && prom >= minimo,
  });
};

// Distribucion de notas por rangos para graficas: [0-1), [1-2), [2-3), [3-4), [4-5]
export const distribucion = (notas: readonly number[]): readonly number[] =>
  notasValidas(notas).reduce<readonly number[]>(
    (conteo, nota) => {
      const indice = Math.min(Math.floor(nota), 4);
      return conteo.map((valor, i) => (i === indice ? valor + 1 : valor));
    },
    [0, 0, 0, 0, 0],
  );

// Clasifico una nota para darle color en la interfaz
export const tonoNota = (
  nota: number | null | undefined,
): 'exito' | 'alerta' | 'peligro' | 'neutro' => {
  if (nota === null || nota === undefined) return 'neutro';
  if (nota >= 4) return 'exito';
  if (nota >= NOTA_MINIMA_APROBACION) return 'alerta';
  return 'peligro';
};
