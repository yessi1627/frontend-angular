import { Routes } from '@angular/router';
import { ListadoTareasComponent } from './components/listado-tareas/listado-tareas.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tareas', pathMatch: 'full' },
  { path: 'tareas', component: ListadoTareasComponent },
];
