import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EstadoVacioComponent } from '../../compartido/estado-vacio.component';
import { InsigniaComponent } from '../../compartido/insignia.component';
import { aFecha, fechaCorta, relativo, relativoDesdeTexto } from '../../core/fechas';
import { distribucion, resumen, tonoNota } from '../../core/funcional/notas';
import { ErrorApi, Resultado, aResultado } from '../../core/funcional/resultado';
import { ApiService } from '../../core/http/api.service';
import { Materia, Notificacion, Tarea } from '../../core/modelos';
import { MateriasService } from '../../core/servicios/materias.service';
import { SesionService } from '../../core/servicios/sesion.service';
import { TareasService } from '../../core/servicios/tareas.service';

interface DatosPanel {
  readonly materias: readonly Materia[];
  readonly tareas: readonly Tarea[];
  readonly notificaciones: readonly Notificacion[];
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, InsigniaComponent, EstadoVacioComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  protected readonly sesion = inject(SesionService);
  private readonly api = inject(ApiService);
  protected readonly datos = signal<Resultado<DatosPanel> | null>(null);
  protected readonly fechaCorta = fechaCorta;
  protected readonly relativoTexto = relativoDesdeTexto;
  protected readonly tonoNota = tonoNota;

  protected readonly esEstudiante = computed(() => this.sesion.rol() === 'ESTUDIANTE');
  protected readonly saludo = computed(() => {
    const hora = new Date().getHours();
    const parte = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    return `${parte}, ${(this.sesion.usuario()?.nombres ?? '').split(' ')[0]}`;
  });

  // Todo lo que muestra el panel se deriva de los datos con funciones puras
  protected readonly panel = computed(() => {
    const r = this.datos();
    if (!r || r.tipo !== 'ok') return null;
    const { tareas, materias, notificaciones } = r.valor;
    const ahora = new Date();
    const abiertas = tareas.filter((t) => aFecha(t.fecha_entrega, t.hora_entrega) >= ahora);
    const proximas = [...abiertas]
      .sort(
        (a, b) =>
          aFecha(a.fecha_entrega, a.hora_entrega).getTime() -
          aFecha(b.fecha_entrega, b.hora_entrega).getTime(),
      )
      .slice(0, 5);
    const notas = tareas
      .map((t) => t.mi_calificacion?.nota)
      .filter((n): n is number => typeof n === 'number');
    return {
      materias: materias.length,
      totalTareas: tareas.length,
      abiertas: abiertas.length,
      vencidas: tareas.filter((t) => t.estado === 'Vencida').length,
      entregadas: tareas.filter((t) => t.estado_entrega === 'Entregada').length,
      porEntregar: tareas.filter((t) => t.estado_entrega === 'Pendiente').length,
      resumenNotas: resumen(notas),
      distribucion: distribucion(notas),
      proximas,
      notificaciones: notificaciones.slice(0, 5),
      materiasConTareas: materias.filter((m) => (m.cantidad_tareas ?? 0) > 0).slice(0, 6),
      maxTareasMateria: Math.max(1, ...materias.map((m) => m.cantidad_tareas ?? 0)),
    };
  });

  constructor() {
    // PARALELISMO: las tres peticiones salen al mismo tiempo y forkJoin espera a que terminen todas.
    // Si fueran en serie, el tiempo total seria la suma de las tres; asi es el de la mas lenta.
    forkJoin({
      materias: inject(MateriasService).listar(),
      tareas: inject(TareasService).listar({ orden: 'fecha_entrega' }),
      notificaciones: this.api.get<readonly Notificacion[]>('/notificaciones', { limite: 5 }),
    })
      .pipe(aResultado())
      .subscribe((resultado) => this.datos.set(resultado));
  }

  protected tiempoRestante(t: Tarea): string {
    return relativo(aFecha(t.fecha_entrega, t.hora_entrega));
  }

  protected urgente(t: Tarea): boolean {
    return aFecha(t.fecha_entrega, t.hora_entrega).getTime() - Date.now() < 48 * 3600 * 1000;
  }

  protected error(r: Resultado<DatosPanel>): ErrorApi | null {
    return r.coincidir({ ok: () => null, fallo: (e) => e });
  }
}
