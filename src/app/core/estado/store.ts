import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

/**
 * Store reactivo base. Guarda el estado de un modulo en un BehaviorSubject:
 *  - Los componentes se suscriben con `seleccionar` y reciben cada cambio automaticamente
 *    (si el profesor guarda una nota, todas las pantallas suscritas se actualizan a la vez).
 *  - El estado es inmutable: se congela con Object.freeze y SOLO se reemplaza por uno nuevo
 *    creado con el operador spread ({ ...anterior, ...cambios }); nunca se modifica en sitio.
 *  - `distinctUntilChanged` evita notificar a la vista si la parte seleccionada no cambio.
 */
export abstract class Store<T extends object> {
  private readonly estado$: BehaviorSubject<Readonly<T>>;

  protected constructor(estadoInicial: T) {
    this.estado$ = new BehaviorSubject<Readonly<T>>(Object.freeze({ ...estadoInicial }));
  }

  // Valor actual (solo lectura)
  get estado(): Readonly<T> {
    return this.estado$.getValue();
  }

  // Flujo con una parte del estado; solo emite cuando esa parte cambia
  seleccionar<R>(selector: (estado: Readonly<T>) => R): Observable<R> {
    return this.estado$.pipe(map(selector), distinctUntilChanged());
  }

  // Creo un estado NUEVO a partir del anterior; el anterior queda intacto
  protected actualizar(cambios: Partial<T> | ((anterior: Readonly<T>) => Partial<T>)): void {
    const anterior = this.estado;
    const parcial = typeof cambios === 'function' ? cambios(anterior) : cambios;
    this.estado$.next(Object.freeze({ ...anterior, ...parcial }));
  }
}
