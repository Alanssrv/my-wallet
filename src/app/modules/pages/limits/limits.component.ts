import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../entities/category';
import { Limit, LimitThreshold, LimitValueType } from '../../entities/limit';
import { AlertService } from '../../../services/alert/alert.service';
import { CategoryStorageService } from '../../../services/category-storage.service';
import { LimitStorageService } from '../../../services/limit-storage.service';

@Component({
  selector: 'app-limits',
  imports: [FormsModule],
  templateUrl: './limits.component.html',
  styleUrl: './limits.component.scss'
})
export class LimitsComponent {
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  alertService = inject(AlertService);
  categoryStorageService = inject(CategoryStorageService);
  limitStorageService = inject(LimitStorageService);

  categories: Category[] = this.categoryStorageService.getCategories();
  limits: Limit[] = this.limitStorageService.getLimits();
  editingLimitCategoryId: number | null = null;

  limitForm = this.createDefaultForm();

  get expenseCategories(): Category[] {
    return this.categories.filter((category) => category.type === 'expense');
  }

  get visibleLimits(): Limit[] {
    return this.limits.filter((limit) => this.isExpenseCategory(limit.categoryId));
  }

  saveLimit(): void {
    const categoryId = this.limitForm.categoryId;
    const maxValue = Number(this.limitForm.maxValue);
    const warningThreshold = this.buildThreshold(this.limitForm.warningType, this.limitForm.warningValue);
    const firstThreshold = this.buildThreshold(this.limitForm.firstType, this.limitForm.firstValue);

    if (categoryId === null || maxValue <= 0) {
      return;
    }

    if (!this.isExpenseCategory(categoryId)) {
      this.alertService.error('Os limites so podem ser vinculados a categorias de saida.');
      return;
    }

    const isDuplicateCategory = this.limits.some(
      (limit) => limit.categoryId === categoryId && limit.categoryId !== this.editingLimitCategoryId
    );

    if (isDuplicateCategory) {
      this.alertService.error('Cada categoria de saida pode ter apenas um limite.');
      return;
    }

    const validationMessage = this.validateThresholds(maxValue, firstThreshold, warningThreshold);

    if (validationMessage) {
      this.alertService.error(validationMessage);
      return;
    }

    const limit = new Limit(
      categoryId,
      maxValue,
      warningThreshold,
      firstThreshold
    );

    if (this.editingLimitCategoryId !== null) {
      this.limits = this.limits
        .filter((currentLimit) => currentLimit.categoryId !== this.editingLimitCategoryId);
      this.limits = [...this.limits, limit];
      this.alertService.success('Limite atualizado com sucesso!');
    } else {
      this.limits = [...this.limits, limit];
      this.alertService.success('Limite criado com sucesso!');
    }

    this.persistLimits();
    this.resetLimitForm();
  }

  startCreateLimit(): void {
    this.categories = this.categoryStorageService.getCategories();
    this.resetLimitForm();
  }

  startEditLimit(limit: Limit): void {
    this.categories = this.categoryStorageService.getCategories();
    this.editingLimitCategoryId = limit.categoryId;
    this.limitForm = {
      categoryId: limit.categoryId,
      maxValue: limit.maxValue,
      warningType: limit.warningValue.type,
      warningValue: limit.warningValue.value,
      firstType: limit.firstValue.type,
      firstValue: limit.firstValue.value
    };
  }

  deleteLimit(categoryId: number): void {
    this.limits = this.limits.filter((limit) => limit.categoryId !== categoryId);
    this.persistLimits();

    if (this.editingLimitCategoryId === categoryId) {
      this.resetLimitForm();
    }

    this.alertService.warning('Limite removido com sucesso!');
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find((category) => category.id === categoryId)?.name ?? 'Categoria removida';
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  formatThreshold(threshold: LimitThreshold, maxValue: number): string {
    if (threshold.type === 'percentage') {
      return `${threshold.value}% (${this.formatCurrency(this.resolveThresholdValue(maxValue, threshold))})`;
    }

    return this.formatCurrency(threshold.value);
  }

  resolveFormThresholdValue(type: LimitValueType, value: number, maxValue: number): number {
    return this.resolveThresholdValue(maxValue, { type, value });
  }

  private createDefaultForm() {
    const firstCategoryId = this.expenseCategories[0]?.id ?? null;

    return {
      categoryId: firstCategoryId,
      maxValue: 0,
      warningType: 'percentage' as LimitValueType,
      warningValue: 80,
      firstType: 'percentage' as LimitValueType,
      firstValue: 50
    };
  }

  private resetLimitForm(): void {
    this.editingLimitCategoryId = null;
    this.limitForm = this.createDefaultForm();
  }

  private persistLimits(): void {
    this.limitStorageService.saveLimits(this.limits);
  }

  private isExpenseCategory(categoryId: number): boolean {
    return this.categories.some((category) => category.id === categoryId && category.type === 'expense');
  }

  private buildThreshold(type: LimitValueType, value: number): LimitThreshold {
    return {
      type,
      value: Number(value)
    };
  }

  private validateThresholds(
    maxValue: number,
    firstThreshold: LimitThreshold,
    warningThreshold: LimitThreshold
  ): string | null {
    if (firstThreshold.value <= 0 || warningThreshold.value <= 0) {
      return 'Os valores de alerta devem ser maiores que zero.';
    }

    if (
      (firstThreshold.type === 'percentage' && firstThreshold.value >= 100) ||
      (warningThreshold.type === 'percentage' && warningThreshold.value >= 100)
    ) {
      return 'Os alertas em percentual devem ser menores que 100%.';
    }

    const firstValue = this.resolveThresholdValue(maxValue, firstThreshold);
    const warningValue = this.resolveThresholdValue(maxValue, warningThreshold);

    if (firstValue >= warningValue) {
      return 'O primeiro alerta deve acontecer antes do aviso.';
    }

    if (warningValue >= maxValue) {
      return 'O aviso deve acontecer antes do limite máximo.';
    }

    return null;
  }

  private resolveThresholdValue(maxValue: number, threshold: LimitThreshold): number {
    if (threshold.type === 'percentage') {
      return maxValue * (threshold.value / 100);
    }

    return threshold.value;
  }

}
