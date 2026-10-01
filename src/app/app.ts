import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisosComponent } from './compartido/avisos.component';
import { ConfirmacionComponent } from './compartido/confirmacion';

@Component({
  imports: [RouterOutlet, AvisosComponent, ConfirmacionComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
