import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../entities/category';
import { AlertService } from '../../../services/alert/alert.service';
import { CategoryStorageService } from '../../../services/category-storage.service';
import { TagsComponent } from '../tags/tags.component';

@Component({
  selector: 'app-categories',
  imports: [FormsModule, CommonModule, TagsComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  alertService = inject(AlertService);
  categoryStorageService = inject(CategoryStorageService);

  categories: Category[] = this.categoryStorageService.getCategories();
  editingCategoryId: number | null = null;

  categoryForm = {
    name: '',
    type: 'expense' as Category['type'],
    color: '#808080'
  };

  saveCategory(): void {
    const name = this.categoryForm.name.trim();

    if (!name) {
      return;
    }

    if (this.editingCategoryId !== null) {
      this.categories = this.categories.map((category) =>
        category.id === this.editingCategoryId
          ? new Category(
              category.id,
              name,
              this.categoryForm.color,
              this.categoryForm.type
            )
          : category
      );
          this.persistCategories();

      this.alertService.success('Categoria atualizada com sucesso!');
      this.resetCategoryForm();
      return;
    }

    this.categories = [
      ...this.categories,
      new Category(
        this.getNextCategoryId(),
        name,
        this.categoryForm.color,
        this.categoryForm.type
      )
    ];
    this.persistCategories();

    this.alertService.success('Categoria criada com sucesso!');
    this.resetCategoryForm();
  }

  startCreateCategory(): void {
    this.resetCategoryForm();
  }

  startEditCategory(category: Category): void {
    this.editingCategoryId = category.id;
    this.categoryForm = {
      name: category.name,
      type: category.type,
      color: category.color
    };
  }

  deleteCategory(categoryId: number): void {
    this.categories = this.categories.filter((category) => category.id !== categoryId);
    this.persistCategories();

    if (this.editingCategoryId === categoryId) {
      this.resetCategoryForm();
    }
  }

  private resetCategoryForm(): void {
    this.editingCategoryId = null;
    this.categoryForm = {
      name: '',
      type: 'expense',
      color: '#808080'
    };
  }

  private getNextCategoryId(): number {
    return this.categories.reduce((maxId, category) => Math.max(maxId, category.id), 0) + 1;
  }

  private persistCategories(): void {
    this.categoryStorageService.saveCategories(this.categories);
  }
}
