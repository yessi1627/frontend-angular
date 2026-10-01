// Tipos de los datos que devuelve la API PHP (api/README.md).
// Todos son readonly: los componentes no deben modificar los objetos que reciben.

export type NombreRol = 'ADMINISTRADOR' | 'PROFESOR' | 'ESTUDIANTE';
export type EstadoTarea = 'Pendiente' | 'Completada' | 'Vencida';
export type EstadoEntrega = 'Entregada' | 'Pendiente' | 'No entrego';

export interface RespuestaApi<T> {
  readonly data: T;
  readonly error: string | null;
  readonly detalles?: Readonly<Record<string, string>>;
}

export interface Rol {
  readonly id: number;
  readonly nombre: string;
  readonly cantidad_usuarios?: number;
}

export interface Usuario {
  readonly id: number;
  readonly nombres: string;
  readonly email: string;
  readonly rol: Rol | null;
  readonly estado?: string;
}

export interface Materia {
  readonly id: number;
  readonly nombre: string;
  readonly cantidad_tareas?: number;
}

export interface Entrega {
  readonly id: number;
  readonly id_tarea: number;
  readonly id_usuario: number;
  readonly archivo: string;
  readonly nombre_original: string | null;
  readonly fecha: string;
  readonly estudiante?: string;
}

export interface Calificacion {
  readonly id: number;
  readonly id_tarea: number;
  readonly id_usuario: number;
  readonly nota: number;
  readonly observacion: string | null;
  readonly fecha: string;
  // Contador para el bloqueo optimista: cambia cada vez que alguien modifica la nota
  readonly version: number;
  readonly estudiante?: string;
  readonly tarea?: string;
  readonly materia?: string;
}

export interface Tarea {
  readonly id: number;
  readonly titulo: string;
  readonly descripcion: string;
  readonly fecha_entrega: string;
  readonly hora_entrega: string;
  readonly estado: EstadoTarea;
  readonly materia: Materia | null;
  readonly archivo: string | null;
  // Solo para el estudiante
  readonly mi_entrega?: Entrega | null;
  readonly mi_calificacion?: Calificacion | null;
  readonly estado_entrega?: EstadoEntrega;
}

export interface EstudianteDeTarea {
  readonly id: number;
  readonly nombres: string;
  readonly email: string;
  readonly entrega: Entrega | null;
  readonly calificacion: Calificacion | null;
  readonly estado_entrega: EstadoEntrega;
}

export interface TareaDetalle extends Tarea {
  readonly estudiantes?: readonly EstudianteDeTarea[];
}

export interface Matricula {
  readonly id: number;
  readonly fecha: string;
  readonly estudiante: {
    readonly id: number;
    readonly nombres: string;
    readonly email: string;
  } | null;
  readonly materia: Materia | null;
}

export interface ResultadoMatricula {
  readonly matriculas_nuevas: number;
  readonly ya_existian: number;
  readonly materias_invalidas: number;
}

export interface PromedioEstudiante {
  readonly id_usuario: number;
  readonly nombres: string;
  readonly cantidad: number;
  readonly promedio: number | null;
  readonly nota_maxima: number | null;
  readonly nota_minima: number | null;
  readonly aprobadas: number;
  readonly aprueba: boolean;
}

export interface Notificacion {
  readonly id: number;
  readonly mensaje: string;
  readonly id_tarea: number;
  readonly fecha: string;
  readonly leido: boolean;
}

export interface Salud {
  readonly servicio: string;
  readonly estado: string;
  readonly base_datos: string;
}
