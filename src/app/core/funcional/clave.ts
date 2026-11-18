// Funcion pura: califico la fuerza de una contraseña de 0 (vacia) a 4 (fuerte)

export interface FuerzaClave {
  readonly nivel: 0 | 1 | 2 | 3 | 4;
  readonly texto: string;
}

const TEXTOS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'] as const;

export const fuerzaClave = (clave: string): FuerzaClave => {
  if (!clave) return { nivel: 0, texto: '' };
  const criterios = [
    clave.length >= 8,
    /[a-z]/.test(clave) && /[A-Z]/.test(clave),
    /\d/.test(clave),
    /[^A-Za-z0-9]/.test(clave),
  ];
  const puntos = criterios.filter(Boolean).length;
  // Una clave corta nunca pasa de "Débil", sin importar los caracteres que tenga
  const nivel = (clave.length < 6 ? 1 : Math.max(1, puntos)) as FuerzaClave['nivel'];
  return { nivel, texto: TEXTOS[nivel] };
};
