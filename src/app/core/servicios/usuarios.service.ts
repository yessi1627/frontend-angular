import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Rol, Usuario } from '../modelos';

export interface DatosUsuario {
  readonly nombres: string;
  readonly email: string;
  readonly rol_id: number;
  readonly password?: string;
  readonly password_confirmacion?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly api = inject(ApiService);

  listar(rol?: string): Observable<readonly Usuario[]> {
    return this.api.get<readonly Usuario[]>('/usuarios', { rol });
  }

  crear(datos: DatosUsuario): Observable<Usuario> {
    return this.api.post<Usuario>('/usuarios', datos);
  }

  actualizar(id: number, datos: DatosUsuario): Observable<Usuario> {
    return this.api.put<Usuario>(`/usuarios/${id}`, datos);
  }

  eliminar(id: number): Observable<null> {
    return this.api.delete(`/usuarios/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly api = inject(ApiService);

  listar(): Observable<readonly Rol[]> {
    return this.api.get<readonly Rol[]>('/roles');
  }

  crear(nombre_rol: string): Observable<Rol> {
    return this.api.post<Rol>('/roles', { nombre_rol });
  }

  actualizar(id: number, nombre_rol: string): Observable<Rol> {
    return this.api.put<Rol>(`/roles/${id}`, { nombre_rol });
  }

  eliminar(id: number): Observable<null> {
    return this.api.delete(`/roles/${id}`);
  }
}
