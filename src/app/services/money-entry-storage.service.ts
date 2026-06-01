import { Injectable } from '@angular/core';
import { MoneyEntry, MoneyOrigin } from '../modules/entities/money-entry';

@Injectable({
  providedIn: 'root'
})
export class MoneyEntryStorageService {
  private readonly storageKey = 'wallet.money-entries';

  getEntries(): MoneyEntry[] {
    const storedEntries = this.readStorage<MoneyEntry[]>();

    if (!storedEntries) {
      return [];
    }

    return storedEntries.map(
      (entry) => new MoneyEntry(
        entry.date,
        entry.value,
        entry.categoryId,
        entry.description ?? '',
        (entry.origin as MoneyOrigin | undefined) ?? 'cash'
      )
    );
  }

  saveEntries(entries: MoneyEntry[]): void {
    this.writeStorage(entries);
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