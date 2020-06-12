import * as ts_module from 'typescript/lib/tsserverlibrary';
import { findChildContainingPosition, positionOrRangeToNumber } from './utils';
import { availableRefactors } from './refactors';

export function getApplicableRefactors(
  info: ts_module.server.PluginCreateInfo,
  fileName: string,
  positionOrRange: ts_module.TextRange | number
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
    .filter((refactor) => refactor.canBeApplied(nodeAtCursor))
    .map((refactor) => ({
      name: refactor.name,
      actions: refactor.actions,
      description: refactor.description,
    }));
}

export function getEditForRefactors(
  fileName: string,
  formatOptions: ts_module.FormatCodeSettings,
  positionOrRange: number | ts_module.TextRange,
  refactorName: string,
  actionName: string,
  preferences: ts_module.UserPreferences | undefined
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
