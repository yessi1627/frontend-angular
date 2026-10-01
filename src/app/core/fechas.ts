// Funciones puras para mostrar fechas en español sin depender de librerias externas

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const formatoCorto = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });

// La API envia "2026-10-02" y "23:59:00"; armo la fecha local sin conversion de zona horaria
export const aFecha = (fecha: string, hora = '00:00:00'): Date => {
  const [a, m, d] = fecha.split('-').map(Number);
  const [h, mi, s] = hora.split(':').map(Number);
  return new Date(a!, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, s ?? 0);
};

export const fechaLarga = (fecha: string): string => formatoFecha.format(aFecha(fecha));
export const fechaCorta = (fecha: string): string => formatoCorto.format(aFecha(fecha));
export const horaCorta = (hora: string): string => formatoHora.format(aFecha('2000-01-01', hora));

// "en 2 días", "hace 3 horas", "mañana"
export const relativo = (destino: Date, ahora: Date = new Date()): string => {
  const ms = destino.getTime() - ahora.getTime();
  const formato = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const minutos = Math.round(ms / 60000);
  if (Math.abs(minutos) < 60) return formato.format(minutos, 'minute');
  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return formato.format(horas, 'hour');
  return formato.format(Math.round(horas / 24), 'day');
};

// Fecha y hora de la API ("2026-10-02 10:30:00") a texto relativo
export const relativoDesdeTexto = (fechaHora: string): string => {
  const [fecha, hora] = fechaHora.split(' ');
  return relativo(aFecha(fecha ?? '', hora ?? '00:00:00'));
};
