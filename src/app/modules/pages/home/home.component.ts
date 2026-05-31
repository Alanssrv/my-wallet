import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert/alert.service';
import { CategoryStorageService } from '../../../services/category-storage.service';
import { LimitStorageService } from '../../../services/limit-storage.service';
import { MoneyEntryStorageService } from '../../../services/money-entry-storage.service';
import { Category } from '../../entities/category';
import { Limit, LimitThreshold } from '../../entities/limit';
import { MoneyEntry } from '../../entities/money-entry';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  alertService = inject(AlertService);
  categoryStorageService = inject(CategoryStorageService);
  limitStorageService = inject(LimitStorageService);
  moneyEntryStorageService = inject(MoneyEntryStorageService);

  categories: Category[] = this.categoryStorageService.getCategories();
  limits: Limit[] = this.limitStorageService.getLimits();
  entries: MoneyEntry[] = this.moneyEntryStorageService.getEntries();
  selectedMonth = this.getCurrentMonth();
  selectedDate = this.getCurrentDate();
  activeEntry: MoneyEntry | null = null;

  entryForm = this.createDefaultEntryForm();

  get monthDays(): string[] {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return `${this.selectedMonth}-${day}`;
    });
  }

  get visibleCategories(): Category[] {
    return [...this.categories].sort((leftCategory, rightCategory) => {
      if (leftCategory.type === rightCategory.type) {
        return leftCategory.name.localeCompare(rightCategory.name);
      }

      return leftCategory.type === 'expense' ? -1 : 1;
    });
  }

  get monthEntries(): MoneyEntry[] {
    return this.entries.filter((entry) => entry.date.startsWith(this.selectedMonth));
  }

  get selectedDayLabel(): string {
    return this.formatDateLabel(this.selectedDate);
  }

  get monthIncomeTotal(): number {
    return this.getMonthTotalByType('income');
  }

  get monthExpenseTotal(): number {
    return this.getMonthTotalByType('expense');
  }

  get monthBalance(): number {
    return this.monthIncomeTotal - this.monthExpenseTotal;
  }

  onMonthChange(): void {
    const firstDayOfMonth = `${this.selectedMonth}-01`;

    if (!this.selectedDate.startsWith(this.selectedMonth)) {
      this.selectedDate = firstDayOfMonth;
    }

    this.entryForm.date = this.selectedDate;
  }

  startCreateEntryForSelectedDay(): void {
    this.reloadData();
    this.entryForm = this.createDefaultEntryForm(this.selectedDate);
  }

  startCreateEntryForDay(date: string): void {
    this.selectedDate = date;
    this.startCreateEntryForSelectedDay();
  }

  saveEntry(): void {
    const categoryId = this.entryForm.categoryId;
    const value = Number(this.entryForm.value);
    const date = this.entryForm.date;
    const description = this.entryForm.description.trim();

    if (categoryId === null || value <= 0 || !date) {
      return;
    }

    const category = this.categories.find((currentCategory) => currentCategory.id === categoryId);
    
    if (!category) {
      this.alertService.error('Selecione uma categoria valida.');
      return;
    }
    
    const limit = this.getLimit(categoryId);
    if (category?.type === 'expense' && limit) {
      const monthTotal = this.getCategoryMonthTotal(categoryId);
      const newTotal = monthTotal + value;
      if (newTotal > limit.maxValue) {
        this.alertService.error('Acima do limite máximo');
      } else if (newTotal > this.resolveThresholdValue(limit.maxValue, limit.warningValue)) {
        this.alertService.warning('Acima do limite de aviso');
      } else if (newTotal > this.resolveThresholdValue(limit.maxValue, limit.firstValue)) {
        this.alertService.info('Acima do primeiro limite de alerta');
      }
    }

    this.entries = [...this.entries, new MoneyEntry(date, value, categoryId, description)];
    this.moneyEntryStorageService.saveEntries(this.entries);
    this.selectedDate = date;
    this.activeEntry = null;
    this.entryForm = this.createDefaultEntryForm(date);
    this.alertService.success('Valor registrado com sucesso!');
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value);
  }

  getEntriesForCell(categoryId: number, date: string): MoneyEntry[] {
    return this.monthEntries.filter((entry) => entry.categoryId === categoryId && entry.date === date);
  }

  getCategoryMonthTotal(categoryId: number): number {
    return this.monthEntries
      .filter((entry) => entry.categoryId === categoryId)
      .reduce((total, entry) => total + entry.value, 0);
  }

  toggleEntryActions(entry: MoneyEntry): void {
    this.activeEntry = this.activeEntry === entry ? null : entry;
  }

  isEntryActive(entry: MoneyEntry): boolean {
    return this.activeEntry === entry;
  }

  removeEntry(entry: MoneyEntry, event: Event): void {
    event.stopPropagation();
    this.entries = this.entries.filter((currentEntry) => currentEntry !== entry);
    this.moneyEntryStorageService.saveEntries(this.entries);
    this.activeEntry = null;
    this.alertService.warning('Valor removido com sucesso!');
  }

  hasEntryDescription(entry: MoneyEntry): boolean {
    return entry.description.trim().length > 0;
  }

  getCellTheme(category: Category, date: string): string {
    if (category.type !== 'expense') {
      return 'entry-cell';
    }

    const limit = this.getLimit(category.id);

    if (!limit) {
      return 'entry-cell';
    }

    const runningTotal = this.getCategoryRunningTotal(category.id, date);
    const maxValue = limit.maxValue;
    const warningValue = this.resolveThresholdValue(maxValue, limit.warningValue);
    const firstValue = this.resolveThresholdValue(maxValue, limit.firstValue);

    if (runningTotal >= maxValue) {
      return 'entry-cell limit-danger';
    }

    if (runningTotal >= warningValue) {
      return 'entry-cell limit-warning';
    }

    if (runningTotal >= firstValue) {
      return 'entry-cell limit-info';
    }

    return 'entry-cell';
  }

  isSelectedDate(date: string): boolean {
    return this.selectedDate === date;
  }

  trackByDate(_: number, date: string): string {
    return date;
  }

  private createDefaultEntryForm(date = this.selectedDate) {
    return {
      date,
      categoryId: this.visibleCategories[0]?.id ?? null,
      value: 0,
      description: ''
    };
  }

  private reloadData(): void {
    this.categories = this.categoryStorageService.getCategories();
    this.limits = this.limitStorageService.getLimits();
    this.entries = this.moneyEntryStorageService.getEntries();
  }

  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private getCurrentDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getLimit(categoryId: number): Limit | undefined {
    return this.limits.find((limit) => limit.categoryId === categoryId);
  }

  private getCategoryRunningTotal(categoryId: number, date: string): number {
    return this.monthEntries
      .filter((entry) => entry.categoryId === categoryId && entry.date <= date)
      .reduce((total, entry) => total + entry.value, 0);
  }

  private resolveThresholdValue(maxValue: number, threshold: LimitThreshold): number {
    if (threshold.type === 'percentage') {
      return maxValue * (threshold.value / 100);
    }

    return threshold.value;
  }

  private getMonthTotalByType(type: Category['type']): number {
    const categoryIds = this.categories
      .filter((category) => category.type === type)
      .map((category) => category.id);

    return this.monthEntries
      .filter((entry) => categoryIds.includes(entry.categoryId))
      .reduce((total, entry) => total + entry.value, 0);
  }

  private formatDateLabel(date: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${date}T00:00:00`));
  }

}
