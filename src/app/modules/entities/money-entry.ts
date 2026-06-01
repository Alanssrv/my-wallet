export type MoneyOrigin = 'nubank' | 'cash' | 'bb' | 'c6';

export class MoneyEntry {
  date: string;
  value: number;
  categoryId: number;
  description: string;
  origin: MoneyOrigin;

  constructor(
    date: string,
    value: number,
    categoryId: number,
    description: string,
    origin: MoneyOrigin
  ) {
    this.date = date;
    this.value = value;
    this.categoryId = categoryId;
    this.description = description;
    this.origin = origin;
  }
}