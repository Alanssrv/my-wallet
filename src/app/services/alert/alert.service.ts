import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface AlertMessage {
  type: AlertType;
  text: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<AlertMessage>();
  alerts$ = this.alertSubject.asObservable();

  show(type: AlertType, text: string, duration = 3000) {
    this.alertSubject.next({ type, text, duration });
  }

  success(text: string, duration = 3000) {
    this.show('success', text, duration);
  }

  warning(text: string, duration = 3000) {
    this.show('warning', text, duration);
  }

  error(text: string, duration = 3000) {
    this.show('error', text, duration);
  }

  info(text: string, duration = 3000) {
    this.show('info', text, duration);
  }
}