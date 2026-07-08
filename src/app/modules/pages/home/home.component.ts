import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert/alert.service';
import { CategoryStorageService } from '../../../services/category-storage.service';
import { LimitStorageService } from '../../../services/limit-storage.service';
import { MoneyEntryStorageService } from '../../../services/money-entry-storage.service';
import { Category } from '../../entities/category';
import { Limit, LimitThreshold } from '../../entities/limit';
import { MoneyEntry, MoneyOrigin } from '../../entities/money-entry';
import { TagSelectorComponent } from '../../components/tag-selector/tag-selector.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [FormsModule, TagSelectorComponent, DatePipe],
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
  editingEntry: MoneyEntry | null = null;
  selectedOriginFilter: MoneyOrigin | null = null;
  readonly originOptions: Array<{ value: MoneyOrigin; label: string; icon?: string; imagePath?: string }> = [
    { value: 'nubank', label: 'Nubank', imagePath: './images/nu.webp' },
    { value: 'cash', label: 'Cash', icon: 'bi-cash-stack' },
    { value: 'bb', label: 'Banco do Brasil (BB)', imagePath: './images/bb.webp' },
    { value: 'c6', label: 'C6', imagePath: './images/c6.webp' }
  ];

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
    let filtered = this.entries.filter((entry) => entry.date.startsWith(this.selectedMonth));
    
    if (this.selectedOriginFilter) {
      filtered = filtered.filter((entry) => entry.origin === this.selectedOriginFilter);
    }
    
    return filtered;
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

  get totalEntries(): MoneyEntry[] {
    if (this.selectedOriginFilter) {
      return this.entries.filter((entry) => entry.origin === this.selectedOriginFilter);
    }
    return this.entries;
  }
  
  get incomeTotal(): number {
    return this.getTotalByType('income');
  }

  get expenseTotal(): number {
    return this.getTotalByType('expense');
  }

  get balanceTotal(): number {
    return this.incomeTotal - this.expenseTotal;
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
    this.editingEntry = null;
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
    const origin = this.entryForm.origin;
    const tagIds = this.entryForm.tagIds;

    if (categoryId === null || value <= 0 || !date || !origin) {
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
      const currentTotal = this.editingEntry
        ? monthTotal - this.editingEntry.value
        : monthTotal;
      const newTotal = currentTotal + value;
      
      if (newTotal > limit.maxValue) {
        this.alertService.error('Acima do limite máximo');
      } else if (newTotal > this.resolveThresholdValue(limit.maxValue, limit.warningValue)) {
        this.alertService.warning('Acima do limite de aviso');
      } else if (newTotal > this.resolveThresholdValue(limit.maxValue, limit.firstValue)) {
        this.alertService.info('Acima do primeiro limite de alerta');
      }
    }

    if (this.editingEntry) {
      // Update existing entry
      const editingIndex = this.entries.indexOf(this.editingEntry);
      this.editingEntry.date = date;
      this.editingEntry.value = value;
      this.editingEntry.categoryId = categoryId;
      this.editingEntry.description = description;
      this.editingEntry.origin = origin;
      this.editingEntry.tagIds = tagIds;
      this.entries = [...this.entries];
      this.alertService.success('Valor atualizado com sucesso!');
    } else {
      // Create new entry
      this.entries = [...this.entries, new MoneyEntry(date, value, categoryId, description, origin, tagIds)];
      this.alertService.success('Valor registrado com sucesso!');
    }

    this.moneyEntryStorageService.saveEntries(this.entries);
    this.selectedDate = date;
    this.activeEntry = null;
    this.editingEntry = null;
    this.entryForm = this.createDefaultEntryForm(date);
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

  editEntry(entry: MoneyEntry, event: Event): void {
    event.stopPropagation();
    this.editingEntry = entry;
    this.entryForm = {
      date: entry.date,
      categoryId: entry.categoryId,
      value: entry.value,
      tagIds: entry.tagIds,
      description: entry.description,
      origin: entry.origin
    };
    this.activeEntry = null;
    // Open the modal
    const modal = document.getElementById('createMoneyEntry');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  toggleOriginFilter(origin: MoneyOrigin): void {
    this.selectedOriginFilter = this.selectedOriginFilter === origin ? null : origin;
  }

  hasEntryDescription(entry: MoneyEntry): boolean {
    return entry.description.trim().length > 0;
  }

  getOriginIcon(origin: MoneyOrigin): string {
    return this.originOptions.find((option) => option.value === origin)?.icon ?? 'bi-wallet2';
  }

  getOriginLabel(origin: MoneyOrigin): string {
    return this.originOptions.find((option) => option.value === origin)?.label ?? origin;
  }

  getOriginImagePath(origin: MoneyOrigin): string | null {
    return this.originOptions.find((option) => option.value === origin)?.imagePath ?? null;
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
      description: '',
      tagIds: [] as number[],
      origin: 'nubank' as MoneyOrigin
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

  private getTotalByType(type: Category['type']): number {
    const categoryIds = this.categories
      .filter((category) => category.type === type)
      .map((category) => category.id);

    return this.totalEntries
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
