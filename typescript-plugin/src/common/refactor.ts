import * as tslib from 'typescript/lib/tsserverlibrary';

export enum ERefactorKind {
  destructureToConstant = 'destructure-to-constant',
  destructureInPlace = 'destructure-in-place',
  destructurePropery = 'destructure-property',
  destructureSpread = 'destructure-spread',
}

export abstract class Refactor implements tslib.ApplicableRefactorInfo {
  abstract name: ERefactorKind;
  abstract description: string;
  abstract actions: tslib.RefactorActionInfo[];

  abstract canBeApplied(node?: tslib.Node): boolean | undefined;
  abstract apply(
    fileName: string,
    formatOptions: tslib.FormatCodeSettings,
    positionOrRange: number | tslib.TextRange,
    refactorName: string,
    actionName: string,
    preferences: tslib.UserPreferences | undefined
  ): tslib.RefactorEditInfo | undefined;

  constructor(protected info: tslib.server.PluginCreateInfo) {}
}