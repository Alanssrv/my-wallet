export class Category {
    id: number;
    name: string;
    color: string;
    type: 'income' | 'expense';

    constructor(id: number, name: string, color: string, type: 'income' | 'expense') {
        this.id = id;
        this.name = name;
        this.color = color;
        this.type = type;
    }
}