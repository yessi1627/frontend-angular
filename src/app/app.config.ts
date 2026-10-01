import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { SesionService } from './core/servicios/sesion.service';
import { TemaService } from './core/servicios/tema.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parametros de la ruta (:id) llegan como input() del componente
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiInterceptor])),
    // Antes de mostrar la primera pantalla pregunto si ya hay sesion y aplico el tema guardado
    provideAppInitializer(() => {
      inject(TemaService);
      return firstValueFrom(inject(SesionService).restaurar());
    }),
  ],
};
