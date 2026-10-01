import { Routes } from '@angular/router';
import { autenticadoGuard, invitadoGuard, rolGuard } from './core/guards';

// Cada pantalla se carga solo cuando se visita (lazy loading con loadComponent)
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./paginas/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        data: { titulo: 'Inicio' },
        loadComponent: () =>
          import('./paginas/inicio/inicio.component').then((m) => m.InicioComponent),
      },
      {
        path: 'tareas',
        data: { titulo: 'Tareas' },
        loadComponent: () =>
          import('./paginas/tareas/tareas-lista.component').then((m) => m.TareasListaComponent),
      },
      {
        path: 'tareas/nueva',
        data: { titulo: 'Nueva tarea', roles: ['ADMINISTRADOR', 'PROFESOR'] },
        canActivate: [rolGuard],
        loadComponent: () =>
          import('./paginas/tareas/tarea-formulario.component').then(
            (m) => m.TareaFormularioComponent,
          ),
      },
      {
        path: 'tareas/:id',
        data: { titulo: 'Detalle de la tarea' },
        loadComponent: () =>
          import('./paginas/tareas/tarea-detalle.component').then((m) => m.TareaDetalleComponent),
      },
      {
        path: 'tareas/:id/editar',
        data: { titulo: 'Editar tarea', roles: ['ADMINISTRADOR', 'PROFESOR'] },
        canActivate: [rolGuard],
        loadComponent: () =>
          import('./paginas/tareas/tarea-formulario.component').then(
            (m) => m.TareaFormularioComponent,
          ),
      },
      {
        path: 'calificaciones',
        data: { titulo: 'Calificaciones' },
        loadComponent: () =>
          import('./paginas/calificaciones/calificaciones.component').then(
            (m) => m.CalificacionesComponent,
          ),
      },
      {
        path: 'materias',
        data: { titulo: 'Materias' },
        loadComponent: () =>
          import('./paginas/materias/materias.component').then((m) => m.MateriasComponent),
      },
      {
        path: 'matriculas',
        data: { titulo: 'Matrículas', roles: ['ADMINISTRADOR'] },
        canActivate: [rolGuard],
        loadComponent: () =>
          import('./paginas/matriculas/matriculas.component').then((m) => m.MatriculasComponent),
      },
      {
        path: 'usuarios',
        data: { titulo: 'Usuarios', roles: ['ADMINISTRADOR'] },
        canActivate: [rolGuard],
        loadComponent: () =>
          import('./paginas/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'roles',
        data: { titulo: 'Roles', roles: ['ADMINISTRADOR'] },
        canActivate: [rolGuard],
        loadComponent: () =>
          import('./paginas/roles/roles.component').then((m) => m.RolesComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
