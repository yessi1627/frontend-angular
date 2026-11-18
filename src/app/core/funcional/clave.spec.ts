import { fuerzaClave } from './clave';

describe('fuerzaClave', () => {
  it('vacia no tiene nivel', () => {
    expect(fuerzaClave('').nivel).toBe(0);
  });

  it('una clave corta siempre es debil', () => {
    expect(fuerzaClave('Ab1!').texto).toBe('Débil');
  });

  it('sube de nivel al combinar mayusculas, numeros y simbolos', () => {
    expect(fuerzaClave('abcdefgh').nivel).toBe(1);
    expect(fuerzaClave('Abcdefgh').nivel).toBe(2);
    expect(fuerzaClave('Abcdefg1').nivel).toBe(3);
    expect(fuerzaClave('Abcdef1!').texto).toBe('Fuerte');
  });
});
