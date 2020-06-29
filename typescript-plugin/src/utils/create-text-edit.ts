import * as tslib from 'typescript/lib/tsserverlibrary';
import { positionOrRangeToRange } from './normalize-position-or-range';

export function createTextEdit(
  fileName: string,
  positionOrRange: number | tslib.TextRange,
  newText: string
) {
  const range = positionOrRangeToRange(positionOrRange);

  return {
    edits: [
      {
        fileName,
        textChanges: [
          {
            span: { start: range.pos, length: range.end - range.pos }, // the segment of code that will be replaced
            newText,
          },
        ],
      },
    ],
    renameFilename: undefined,
    renameLocation: undefined,
  };
}