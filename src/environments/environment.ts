// Angular solo habla con el API Gateway: una unica direccion de entrada que reparte las peticiones
// entre el backend PHP y los microservicios (servicios/gateway en el repositorio del backend).
const gatewayUrl = 'http://localhost:8080';

export const environment = {
  gatewayUrl,
  apiUrl: `${gatewayUrl}/api`,
  uploadsUrl: `${gatewayUrl}/uploads`,
  notificacionesUrl: `${gatewayUrl}/notificaciones`,
  calendarioUrl: `${gatewayUrl}/calendario`,
  // Cada cuanto reviso si hay notificaciones nuevas (polling reactivo)
  intervaloNotificacionesMs: 30000,
};
