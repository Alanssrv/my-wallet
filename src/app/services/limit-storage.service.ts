import { Injectable } from '@angular/core';
import { Limit } from '../modules/entities/limit';

@Injectable({
  providedIn: 'root'
})
export class LimitStorageService {
  private readonly storageKey = 'wallet.limits';

  getLimits(): Limit[] {
    const storedLimits = this.readStorage<Limit[]>();

    if (!storedLimits) {
      return [];
    }

    const uniqueLimits = new Map<number, Limit>();

    storedLimits.forEach((limit) => {
      uniqueLimits.set(
        limit.categoryId,
        new Limit(limit.categoryId, limit.maxValue, limit.warningValue, limit.firstValue)
      );
    });

    return Array.from(uniqueLimits.values());
  }

  saveLimits(limits: Limit[]): void {
    this.writeStorage(limits);
  }

  private readStorage<T>(): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  private writeStorage(value: unknown): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(value));
  }
}