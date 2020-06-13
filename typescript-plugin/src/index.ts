import * as tslib from 'typescript/lib/tsserverlibrary';
import { findChildContainingPosition, positionOrRangeToNumber } from './utils';
import { availableRefactors } from './refactors';

export function getApplicableRefactors(
  info: tslib.server.PluginCreateInfo,
  fileName: string,
  positionOrRange: tslib.TextRange | number
) {
  const program = info.languageService.getProgram();
  const sourceFile = program && program.getSourceFile(fileName);

  if (!program || !sourceFile) {
    return [];
  }

  const nodeAtCursor = findChildContainingPosition(
    sourceFile,
    positionOrRangeToNumber(positionOrRange)
  );

  return availableRefactors
    .filter((refactor) => refactor.canBeApplied(nodeAtCursor, fileName, positionOrRange))
    .map((refactor) => ({
      name: refactor.name,
      actions: refactor.actions,
      description: refactor.description,
    }));
}

export function getEditForRefactors(
  fileName: string,
  formatOptions: tslib.FormatCodeSettings,
  positionOrRange: number | tslib.TextRange,
  refactorName: string,
  actionName: string,
  preferences: tslib.UserPreferences | undefined
) {
  const refactor = availableRefactors.find((ref) => ref.name === actionName);

  return (
    refactor &&
    refactor.apply(
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    )
  );
}
