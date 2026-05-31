import { Injectable } from '@angular/core';
import { Category } from '../modules/entities/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryStorageService {
  private readonly storageKey = 'wallet.categories';

  getCategories(): Category[] {
    const storedCategories = this.readStorage<Category[]>();

    if (!storedCategories) {
      return [];
    }

    return storedCategories.map(
      (category) => new Category(category.id, category.name, category.color, category.type)
    );
  }

  saveCategories(categories: Category[]): void {
    this.writeStorage(categories);
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