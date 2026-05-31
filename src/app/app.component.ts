import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './modules/components/header/header.component';
import { AlertComponent } from './services/alert/alert.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, AlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-wallet';
}
