import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Tarea, TareasService } from '../../services/tareas.service';

@Component({
  selector: 'app-listado-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listado-tareas.component.html',
  styleUrl: './listado-tareas.component.css',
})
export class ListadoTareasComponent implements OnInit {
  tareas: Tarea[] = [];
  cargando = true;
  error = false;
  mensajeError = '';

  constructor(private readonly tareasService: TareasService) {}

  ngOnInit(): void {
    this.cargarTareas();
  }

  cargarTareas(): void {
    this.cargando = true;
    this.error = false;

    this.tareasService.obtenerTareas().subscribe({
      next: (tareas) => {
        this.tareas = tareas;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.mensajeError =
          'No se pudieron cargar las tareas. Verifica que hayas iniciado sesión en el sistema.';
        this.cargando = false;
      },
    });
  }
}
