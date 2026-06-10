import { Component, Input, Output, EventEmitter, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tag } from '../../entities/tag';
import { TagStorageService } from '../../../services/tag-storage.service';

@Component({
  selector: 'app-tag-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tag-selector.component.html',
  styleUrl: './tag-selector.component.scss'
})
export class TagSelectorComponent {
  private _selectedTagIds: number[] = [];
  @Input() set selectedTagIds(value: number[]) {
    this._selectedTagIds = value;
    this.selectedItems = this.tagStorageService.getTagsByIds(this._selectedTagIds);
  }

  get selectedTagIds(): number[] {
    return this._selectedTagIds;
  }

  @Output() selectedTagIdsChange = new EventEmitter<number[]>();

  tagStorageService = inject(TagStorageService);

  availableTags: Tag[] = [];
  selectedItems: Tag[] = [];
  searchQuery: string = '';

  ngOnInit(): void {
    this.availableTags = this.tagStorageService.getTags();
  }

  toggleSelection(option: Tag, checked: boolean): void {
    if (checked) {
      const exists = this.selectedItems.some(item => item.id === option.id);
      if (!exists) {
        this.selectedItems.push(option);
        this.selectedTagIds = [...this.selectedTagIds, option.id];
        this.selectedTagIdsChange.emit(this.selectedTagIds);
      }
    } else {
      this.removeItem(option.id.toString());
    }
  }

  removeItem(value: string): void {
    this.selectedItems = this.selectedItems.filter(item => item.id.toString() !== value);
    this.selectedTagIds = this.selectedTagIds.filter(id => id.toString() !== value);
    this.selectedTagIdsChange.emit(this.selectedTagIds);
  }

  isSelected(value: string): boolean {
    return this.selectedItems.some(item => item.id.toString() === value);
  }
}
