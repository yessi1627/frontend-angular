// Direcciones del backend. En la Fase 4 apuntaran al API Gateway en lugar de Apache.
export const environment = {
  apiUrl: 'http://localhost/proyectoGestorEscolar/api',
  uploadsUrl: 'http://localhost/proyectoGestorEscolar/config/uploads',
  // Cada cuanto reviso si hay notificaciones nuevas (polling reactivo)
  intervaloNotificacionesMs: 30000,
};
