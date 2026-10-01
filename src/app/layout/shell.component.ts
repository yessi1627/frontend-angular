import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { NotificacionesStore } from '../core/estado/notificaciones.store';
import { NombreRol } from '../core/modelos';
import { SesionService } from '../core/servicios/sesion.service';
import { TemaService } from '../core/servicios/tema.service';
import { CampanaComponent } from './campana.component';

interface ItemMenu {
  readonly ruta: string;
  readonly texto: string;
  readonly icono: string;
  readonly roles: readonly NombreRol[];
}

const MENU: readonly ItemMenu[] = [
  {
    ruta: '/inicio',
    texto: 'Inicio',
    icono: 'grid-1x2',
    roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'],
  },
  {
    ruta: '/tareas',
    texto: 'Tareas',
    icono: 'journal-text',
    roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'],
  },
  {
    ruta: '/calificaciones',
    texto: 'Calificaciones',
    icono: 'award',
    roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'],
  },
  {
    ruta: '/materias',
    texto: 'Materias',
    icono: 'book',
    roles: ['ADMINISTRADOR', 'PROFESOR', 'ESTUDIANTE'],
  },
  { ruta: '/matriculas', texto: 'Matrículas', icono: 'person-check', roles: ['ADMINISTRADOR'] },
  { ruta: '/usuarios', texto: 'Usuarios', icono: 'people', roles: ['ADMINISTRADOR'] },
  { ruta: '/roles', texto: 'Roles', icono: 'shield-lock', roles: ['ADMINISTRADOR'] },
];

const NOMBRE_ROL: Readonly<Record<NombreRol, string>> = {
  ADMINISTRADOR: 'Administrador',
  PROFESOR: 'Profesor',
  ESTUDIANTE: 'Estudiante',
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CampanaComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  protected readonly sesion = inject(SesionService);
  protected readonly tema = inject(TemaService);
  private readonly notificaciones = inject(NotificacionesStore);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuario = signal(false);
  protected readonly menu = computed(() =>
    MENU.filter((item) => item.roles.includes(this.sesion.rol()!)),
  );
  protected readonly nombreRol = computed(() => {
    const rol = this.sesion.rol();
    return rol ? NOMBRE_ROL[rol] : '';
  });

  // Titulo de la pagina actual tomado de data.titulo de la ruta mas profunda
  protected readonly titulo = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.tituloActual()),
    ),
    { initialValue: this.tituloActual() },
  );

  ngOnInit(): void {
    // El polling de notificaciones vive mientras el usuario este dentro del sistema
    this.notificaciones.iniciar();
    this.destroyRef.onDestroy(() => this.notificaciones.detener());
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }

  protected salir(): void {
    this.sesion.cerrarSesion().subscribe(() => this.router.navigate(['/login']));
  }

  private tituloActual(): string {
    let actual = this.ruta.snapshot;
    while (actual.firstChild) actual = actual.firstChild;
    return (actual.data['titulo'] as string | undefined) ?? '';
  }
}
