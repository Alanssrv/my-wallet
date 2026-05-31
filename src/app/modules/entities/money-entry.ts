export class MoneyEntry {
  date: string;
  value: number;
  categoryId: number;
  description: string;

  constructor(date: string, value: number, categoryId: number, description: string) {
    this.date = date;
    this.value = value;
    this.categoryId = categoryId;
    this.description = description;
  }
}