export type LimitValueType = 'absolute' | 'percentage';

export interface LimitThreshold {
  type: LimitValueType;
  value: number;
}

export class Limit {
  categoryId: number;
  maxValue: number;
  warningValue: LimitThreshold;
  firstValue: LimitThreshold;

  constructor(
    categoryId: number,
    maxValue: number,
    warningValue: LimitThreshold,
    firstValue: LimitThreshold
  ) {
    this.categoryId = categoryId;
    this.maxValue = maxValue;
    this.warningValue = warningValue;
    this.firstValue = firstValue;
  }
}