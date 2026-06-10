import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tag } from '../../entities/tag';
import { AlertService } from '../../../services/alert/alert.service';
import { TagStorageService } from '../../../services/tag-storage.service';
import { MoneyEntryStorageService } from '../../../services/money-entry-storage.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss'
})
export class TagsComponent {
  alertService = inject(AlertService);
  tagStorageService = inject(TagStorageService);
  moneyEntryStorageService = inject(MoneyEntryStorageService);

  tags: Tag[] = this.tagStorageService.getTags();
  editingTagId: number | null = null;

  tagForm = {
    name: '',
    color: '#808080'
  };

  saveTag(): void {
    const name = this.tagForm.name.trim();

    if (!name) {
      return;
    }

    if (this.editingTagId !== null) {
      this.tags = this.tags.map((tag) =>
        tag.id === this.editingTagId
          ? new Tag(tag.id, name, this.tagForm.color)
          : tag
      );
      this.persistTags();

      this.alertService.success('Tag atualizada com sucesso!');
      this.resetTagForm();
      return;
    }

    this.tags = [
      ...this.tags,
      new Tag(this.getNextTagId(), name, this.tagForm.color)
    ];
    this.persistTags();

    this.alertService.success('Tag criada com sucesso!');
    this.resetTagForm();
  }

  startCreateTag(): void {
    this.resetTagForm();
  }

  startEditTag(tag: Tag): void {
    this.editingTagId = tag.id;
    this.tagForm = {
      name: tag.name,
      color: tag.color
    };
  }

  deleteTag(tagId: number): void {
    // Check if tag is linked to any entries
    const entries = this.moneyEntryStorageService.getEntries();
    const isTagLinked = entries.some(entry => entry.tagIds && entry.tagIds.includes(tagId));

    if (isTagLinked) {
      this.alertService.error('Não é possível deletar uma tag que está vinculada a uma movimentação!');
      return;
    }

    this.tags = this.tags.filter((tag) => tag.id !== tagId);
    this.persistTags();

    if (this.editingTagId === tagId) {
      this.resetTagForm();
    }

    this.alertService.success('Tag deletada com sucesso!');
  }

  private persistTags(): void {
    this.tagStorageService.saveTags(this.tags);
  }

  private resetTagForm(): void {
    this.editingTagId = null;
    this.tagForm = {
      name: '',
      color: '#808080'
    };
  }

  private getNextTagId(): number {
    return this.tags.reduce((maxId, tag) => Math.max(maxId, tag.id), 0) + 1;
  }
}
