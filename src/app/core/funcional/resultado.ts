import { HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, catchError, map, of } from 'rxjs';

/**
 * Resultado<T, E>: representa una operacion que puede salir bien (Ok con un valor T)
 * o mal (Fallo con un error E), sin lanzar excepciones. Es equivalente a Either en
 * programacion funcional o a Result en Rust.
 *
 * Por que es un FUNCTOR: tiene `map`, que transforma el valor de un Ok sin sacarlo de
 * la "caja" y deja intacto un Fallo. Cumple las leyes de functor:
 *   - identidad:   r.map(x => x) es equivalente a r
 *   - composicion: r.map(f).map(g) es equivalente a r.map(x => g(f(x)))
 *
 * Por que es una MONADA: ademas tiene `flatMap` (bind/chain), que encadena una funcion
 * que tambien devuelve un Resultado sin anidar cajas (Resultado<Resultado<...>>), y una
 * forma de envolver un valor (`ok`, el "return"/"unit" de la monada). Cumple:
 *   - identidad izquierda: ok(a).flatMap(f) es equivalente a f(a)
 *   - identidad derecha:   r.flatMap(ok) es equivalente a r
 *   - asociatividad:       r.flatMap(f).flatMap(g) es equivalente a r.flatMap(x => f(x).flatMap(g))
 * Si en cualquier paso hay un Fallo, los pasos siguientes no se ejecutan.
 *
 * Los objetos se congelan con Object.freeze: un Resultado nunca cambia despues de creado.
 */
export type Resultado<T, E = ErrorApi> = Ok<T, E> | Fallo<T, E>;

export interface ErrorApi {
  readonly codigo: number;
  readonly mensaje: string;
  readonly detalles: Readonly<Record<string, string>>;
}

interface OperacionesResultado<T, E> {
  map<U>(f: (valor: T) => U): Resultado<U, E>;
  flatMap<U>(f: (valor: T) => Resultado<U, E>): Resultado<U, E>;
  mapError<F>(f: (error: E) => F): Resultado<T, F>;
  obtenerO(porDefecto: T): T;
  coincidir<R>(casos: { ok: (valor: T) => R; fallo: (error: E) => R }): R;
}

export interface Ok<T, E> extends OperacionesResultado<T, E> {
  readonly tipo: 'ok';
  readonly valor: T;
}

export interface Fallo<T, E> extends OperacionesResultado<T, E> {
  readonly tipo: 'fallo';
  readonly error: E;
}

export function ok<T, E = ErrorApi>(valor: T): Resultado<T, E> {
  return Object.freeze<Ok<T, E>>({
    tipo: 'ok',
    valor,
    map: (f) => ok(f(valor)),
    flatMap: (f) => f(valor),
    mapError: () => ok(valor),
    obtenerO: () => valor,
    coincidir: (casos) => casos.ok(valor),
  });
}

export function fallo<T, E = ErrorApi>(error: E): Resultado<T, E> {
  return Object.freeze<Fallo<T, E>>({
    tipo: 'fallo',
    error,
    map: () => fallo(error),
    flatMap: () => fallo(error),
    mapError: (f) => fallo(f(error)),
    obtenerO: (porDefecto) => porDefecto,
    coincidir: (casos) => casos.fallo(error),
  });
}

export function esOk<T, E>(r: Resultado<T, E>): r is Ok<T, E> {
  return r.tipo === 'ok';
}

// Convierto cualquier error HTTP de la API en un ErrorApi con mensaje legible
export function aErrorApi(error: unknown): ErrorApi {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as { error?: string; detalles?: Record<string, string> } | null;
    const mensaje =
      cuerpo?.error ??
      (error.status === 0
        ? 'No hay conexión con el servidor. Verifique que Apache esté encendido.'
        : 'Ocurrió un error inesperado');
    return { codigo: error.status, mensaje, detalles: cuerpo?.detalles ?? {} };
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return { codigo: 0, mensaje: 'El servidor tardó demasiado en responder', detalles: {} };
  }
  return { codigo: 0, mensaje: 'Ocurrió un error inesperado', detalles: {} };
}

/**
 * Operador RxJS: convierte un Observable<T> que puede fallar en un Observable<Resultado<T>>
 * que nunca falla. Asi el flujo reactivo (por ejemplo, el buscador) no se corta con un error
 * y la vista decide que mostrar con `coincidir`.
 */
export function aResultado<T>(): OperatorFunction<T, Resultado<T>> {
  return (fuente: Observable<T>) =>
    fuente.pipe(
      map((valor) => ok<T>(valor)),
      catchError((error: unknown) => of(fallo<T>(aErrorApi(error)))),
    );
}
