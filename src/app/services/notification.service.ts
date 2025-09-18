// Notification Service - Handles user notifications and feedback
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationSubject = new Subject<Notification>();
  private idCounter = 0;

  /**
   * Observable stream of notifications
   */
  notifications$: Observable<Notification> = this.notificationSubject.asObservable();

  /**
   * Shows a success notification
   */
  showSuccess(message: string, duration = 3000): void {
    this.show({
      type: 'success',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Shows an error notification
   */
  showError(message: string, duration = 5000): void {
    this.show({
      type: 'error',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Shows a warning notification
   */
  showWarning(message: string, duration = 4000): void {
    this.show({
      type: 'warning',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Shows an info notification
   */
  showInfo(message: string, duration = 3000): void {
    this.show({
      type: 'info',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Shows a notification with custom options
   */
  show(options: Partial<Notification>): void {
    const notification: Notification = {
      id: this.generateId(),
      type: 'info',
      message: '',
      duration: 3000,
      dismissible: true,
      ...options
    };

    this.notificationSubject.next(notification);

    // Auto-dismiss after duration if specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Dismisses a notification by ID
   */
  dismiss(id: string): void {
    // In a real implementation, this would communicate with a notification component
    // to remove the notification from the UI
    console.log(`Dismissing notification: ${id}`);
  }

  /**
   * Generates a unique ID for notifications
   */
  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }
}