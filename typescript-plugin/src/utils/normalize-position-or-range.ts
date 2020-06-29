import * as tslib from 'typescript/lib/tsserverlibrary';

export function positionOrRangeToRange(
  positionOrRange: number | tslib.TextRange
): tslib.TextRange {
  return typeof positionOrRange === 'number'
    ? { pos: positionOrRange, end: positionOrRange }
    : positionOrRange;
}


export function positionOrRangeToNumber(
  positionOrRange: number | tslib.TextRange
): number {
  return typeof positionOrRange === 'number'
    ? positionOrRange
    : (positionOrRange as tslib.TextRange).pos;
}