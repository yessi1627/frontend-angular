import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ErrorApi, Resultado, aResultado, fallo, ok } from './resultado';

// Comparo dos resultados por su contenido
const valorDe = <T>(r: Resultado<T, string>) =>
  r.coincidir({ ok: (v) => ['ok', v], fallo: (e) => ['fallo', e] });

describe('Resultado<T, E>', () => {
  const doble = (x: number) => x * 2;
  const masUno = (x: number) => x + 1;
  const mitadSegura = (x: number): Resultado<number, string> =>
    x % 2 === 0 ? ok(x / 2) : fallo('impar');

  it('ley de identidad del functor: map(x => x) no cambia nada', () => {
    expect(valorDe(ok<number, string>(4).map((x) => x))).toEqual(valorDe(ok(4)));
  });

  it('ley de composicion del functor: map(f).map(g) = map(g(f(x)))', () => {
    const r = ok<number, string>(3);
    expect(valorDe(r.map(doble).map(masUno))).toEqual(valorDe(r.map((x) => masUno(doble(x)))));
  });

  it('identidad izquierda de la monada: ok(a).flatMap(f) = f(a)', () => {
    expect(valorDe(ok<number, string>(8).flatMap(mitadSegura))).toEqual(valorDe(mitadSegura(8)));
  });

  it('identidad derecha de la monada: r.flatMap(ok) = r', () => {
    const r = ok<number, string>(5);
    expect(valorDe(r.flatMap((x) => ok(x)))).toEqual(valorDe(r));
  });

  it('asociatividad de la monada', () => {
    const r = ok<number, string>(16);
    expect(valorDe(r.flatMap(mitadSegura).flatMap(mitadSegura))).toEqual(
      valorDe(r.flatMap((x) => mitadSegura(x).flatMap(mitadSegura))),
    );
  });

  it('un fallo detiene la cadena', () => {
    const r = ok<number, string>(6).flatMap(mitadSegura).flatMap(mitadSegura).map(doble);
    expect(valorDe(r)).toEqual(['fallo', 'impar']);
    expect(r.obtenerO(0)).toBe(0);
  });

  it('es inmutable', () => {
    expect(Object.isFrozen(ok(1))).toBe(true);
    expect(Object.isFrozen(fallo('x'))).toBe(true);
  });

  it('aResultado convierte un error HTTP en Fallo sin cortar el flujo', async () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { data: null, error: 'Este rol ya existe' },
    });
    const r = await firstValueFrom(throwError(() => error).pipe(aResultado()));
    expect(r.coincidir<ErrorApi | null>({ ok: () => null, fallo: (e) => e })).toEqual({
      codigo: 409,
      mensaje: 'Este rol ya existe',
      detalles: {},
    });
    const bien = await firstValueFrom(of(7).pipe(aResultado()));
    expect(bien.obtenerO(0)).toBe(7);
  });
});
