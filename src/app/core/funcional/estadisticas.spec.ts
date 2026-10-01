import { agregarBloque, combinar, particionar } from './estadisticas';

describe('estadisticas con particionamiento', () => {
  const notas = Array.from({ length: 1003 }, (_, i) => ((i * 37) % 51) / 10);

  it('particiona en bloques contiguos sin perder ni repetir datos', () => {
    const bloques = particionar(notas, 4);
    expect(bloques.length).toBe(4);
    expect(bloques.flat()).toEqual(notas);
  });

  it('el resultado es el mismo con 1 bloque o con varios (map-reduce)', () => {
    const secuencial = combinar([agregarBloque(notas)]);
    for (const n of [2, 3, 4, 7]) {
      expect(combinar(particionar(notas, n).map(agregarBloque))).toEqual(secuencial);
    }
  });

  it('calcula promedio, extremos, aprobacion e histograma', () => {
    const r = combinar([agregarBloque([5, 4, 3, 2, 1])]);
    expect(r).toEqual({
      cantidad: 5,
      promedio: 3,
      desviacion: 1.41,
      minima: 1,
      maxima: 5,
      porcentajeAprobadas: 60,
      histograma: [0, 1, 1, 1, 2],
    });
  });

  it('no modifica los datos de entrada y maneja listas vacias', () => {
    const copia = [...notas];
    particionar(notas, 3);
    agregarBloque(notas);
    expect(notas).toEqual(copia);
    expect(combinar(particionar([], 4).map(agregarBloque)).promedio).toBeNull();
  });
});
