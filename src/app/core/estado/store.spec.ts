import { Store } from './store';

interface Contador {
  readonly valor: number;
  readonly etiqueta: string;
}

class StorePrueba extends Store<Contador> {
  constructor() {
    super({ valor: 0, etiqueta: 'inicio' });
  }
  incrementar(): void {
    this.actualizar((anterior) => ({ valor: anterior.valor + 1 }));
  }
  renombrar(etiqueta: string): void {
    this.actualizar({ etiqueta });
  }
}

describe('Store reactivo', () => {
  it('notifica cada cambio a los suscriptores', () => {
    const store = new StorePrueba();
    const valores: number[] = [];
    store.seleccionar((e) => e.valor).subscribe((v) => valores.push(v));
    store.incrementar();
    store.incrementar();
    expect(valores).toEqual([0, 1, 2]);
  });

  it('no notifica si la parte seleccionada no cambio (distinctUntilChanged)', () => {
    const store = new StorePrueba();
    const valores: number[] = [];
    store.seleccionar((e) => e.valor).subscribe((v) => valores.push(v));
    store.renombrar('otro');
    expect(valores).toEqual([0]);
  });

  it('crea un estado nuevo en cada cambio y el anterior queda intacto', () => {
    const store = new StorePrueba();
    const anterior = store.estado;
    store.incrementar();
    expect(store.estado).not.toBe(anterior);
    expect(anterior.valor).toBe(0);
    expect(Object.isFrozen(store.estado)).toBe(true);
  });
});
