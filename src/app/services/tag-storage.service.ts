import { Injectable } from '@angular/core';
import { Tag } from '../modules/entities/tag';

@Injectable({
  providedIn: 'root'
})
export class TagStorageService {
  private readonly storageKey = 'wallet.tags';

  getTags(): Tag[] {
    const storedTags = this.readStorage<Tag[]>();

    if (!storedTags) {
      return [];
    }

    return storedTags.map(
      (tag) => new Tag(tag.id, tag.name, tag.color)
    );
  }

  saveTags(tags: Tag[]): void {
    this.writeStorage(tags);
  }

  getTagsByIds(tagIds: number[]): Tag[] {
    const allTags = this.getTags();
    return allTags.filter(tag => tagIds.includes(tag.id));
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
