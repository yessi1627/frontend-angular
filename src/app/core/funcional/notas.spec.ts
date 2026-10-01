import {
  aprobadas,
  distribucion,
  notaMaxima,
  notaMinima,
  notasValidas,
  promedio,
  resumen,
  tonoNota,
} from './notas';

describe('funciones puras de notas', () => {
  const notas = [4.5, 3.0, 2.0, 5.0] as const;

  it('calcula el promedio redondeado a 2 decimales', () => {
    expect(promedio(notas)).toBe(3.63);
    expect(promedio([])).toBeNull();
  });

  it('obtiene maxima, minima y aprobadas', () => {
    expect(notaMaxima(notas)).toBe(5);
    expect(notaMinima(notas)).toBe(2);
    expect(aprobadas(notas)).toEqual([4.5, 3.0, 5.0]);
  });

  it('descarta valores fuera de 0 a 5 o no numericos', () => {
    expect(notasValidas([4, -1, 7, Number.NaN, null, undefined, 0])).toEqual([4, 0]);
  });

  it('no modifica el arreglo recibido (sin efectos secundarios)', () => {
    const original = [3.5, 1.0, 4.0];
    const copia = [...original];
    resumen(original);
    distribucion(original);
    expect(original).toEqual(copia);
  });

  it('siempre devuelve lo mismo para la misma entrada', () => {
    expect(resumen(notas)).toEqual(resumen(notas));
  });

  it('arma el resumen y la distribucion por rangos', () => {
    expect(resumen(notas)).toEqual({
      cantidad: 4,
      promedio: 3.63,
      maxima: 5,
      minima: 2,
      aprobadas: 3,
      reprobadas: 1,
      aprueba: true,
    });
    expect(distribucion(notas)).toEqual([0, 0, 1, 1, 2]);
  });

  it('clasifica la nota por color', () => {
    expect(tonoNota(4.2)).toBe('exito');
    expect(tonoNota(3.1)).toBe('alerta');
    expect(tonoNota(2.9)).toBe('peligro');
    expect(tonoNota(null)).toBe('neutro');
  });
});
