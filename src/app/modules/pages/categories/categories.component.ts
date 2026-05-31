import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { Category } from '../../entities/category';
import { AlertService } from '../../../services/alert/alert.service';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  alertService = inject(AlertService);

  categories: Category[] = [];
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

      this.alertService.success('Categoria atualizada com sucesso!');
      this.resetCategoryForm();
      return;
    }

    this.categories = [
      ...this.categories,
      new Category(
        this.categories.length + 1,
        name,
        this.categoryForm.color,
        this.categoryForm.type
      )
    ];

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
}
