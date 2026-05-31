import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertMessage, AlertService } from './alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit, OnDestroy {
  toasts: AlertMessage[] = [];
  private sub?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.sub = this.alertService.alerts$.subscribe((toast) => {
      this.toasts.push(toast);

      setTimeout(() => {
        this.remove(toast);
      }, toast.duration || 3000);
    });
  }

  remove(toast: AlertMessage) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getHeaderClass(type: string): string {
    switch (type) {
      case 'success':
        return 'text-bg-success';
      case 'warning':
        return 'text-bg-warning';
      case 'error':
        return 'text-bg-danger';
      case 'info':
        return 'text-bg-info';
      default:
        return 'text-bg-secondary';
    }
  }
}