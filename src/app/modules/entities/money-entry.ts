export type MoneyOrigin = 'nubank' | 'cash' | 'bb' | 'c6';

export class MoneyEntry {
  date: string;
  value: number;
  categoryId: number;
  description: string;
  origin: MoneyOrigin;
  tagIds: number[];

  constructor(
    date: string,
    value: number,
    categoryId: number,
    description: string,
    origin: MoneyOrigin,
    tagIds: number[] = []
  ) {
    this.date = date;
    this.value = value;
    this.categoryId = categoryId;
    this.description = description;
    this.origin = origin;
    this.tagIds = tagIds;
  }
}