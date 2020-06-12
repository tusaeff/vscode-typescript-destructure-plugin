import * as ts_module from 'typescript/lib/tsserverlibrary';

export enum ERefactorKind {
  destructureToConstant = 'destructure-to-constant',
  destructureInPlace = 'destructure-in-place',
  destructurePropery = 'destructure-property',
  destructureSpread = 'destructure-spread',
}

export abstract class Refactor implements ts_module.ApplicableRefactorInfo {
  abstract name: ERefactorKind;
  abstract description: string;
  abstract actions: ts_module.RefactorActionInfo[];

  abstract canBeApplied(node?: ts_module.Node): boolean | undefined;
  abstract apply(
    fileName: string,
    formatOptions: ts_module.FormatCodeSettings,
    positionOrRange: number | ts_module.TextRange,
    refactorName: string,
    actionName: string,
    preferences: ts_module.UserPreferences | undefined
  ): ts_module.RefactorEditInfo | undefined;

  constructor(protected info: ts_module.server.PluginCreateInfo) {}
}