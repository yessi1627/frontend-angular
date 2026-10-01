# SIULT · Frontend Angular

Interfaz web del Sistema de Gestión Escolar. Angular 22 (standalone, sin zone.js), RxJS 7.8,
Bootstrap 5 como base y un sistema de diseño propio con modo claro y oscuro.

Toda la comunicación pasa por el **API Gateway** del backend (`http://localhost:8080`), que reparte las peticiones
entre la API PHP y los microservicios de notificaciones y calendario (ver `servicios/README.md` en el repositorio del backend).

## Requisitos

- Node.js 22 o superior y npm.
- Backend y microservicios encendidos: `http://localhost:8080/salud` debe responder `"estado":"ok"`
  (ver "Cómo ejecutarlo" en el README del backend).

## Ejecutar

```bash
npm install
npm start          # http://localhost:4200
```

Usuarios de prueba (clave `123`): `admin@admin.com`, `profesor@gmail.com`, `estudiante@gmail.com`.

## Pruebas y compilación

```bash
npm test           # pruebas unitarias con Vitest
npm run build      # compilación de producción en dist/
```

## Estructura

```
src/app/
├── core/
│   ├── funcional/    resultado.ts (mónada Resultado<T,E>) y notas.ts (funciones puras)
│   ├── estado/       store.ts (BehaviorSubject inmutable), calificaciones y notificaciones
│   ├── http/         ApiService e interceptor (credenciales, X-Requested-With, 401)
│   ├── servicios/    servicios HTTP por recurso, sesión, tema y avisos
│   ├── modelos.ts    tipos readonly de la API
│   └── guards.ts     acceso por sesión y por rol
├── layout/           menú lateral, barra superior y campana de notificaciones
├── compartido/       insignias, estados vacíos, confirmación y avisos
└── paginas/          login, inicio, tareas, calificaciones, materias, matrículas, usuarios, roles
```

La configuración de las URLs del backend está en `src/environments/environment.ts`.
