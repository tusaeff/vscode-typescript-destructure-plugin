import * as tslib from 'typescript/lib/tsserverlibrary';
import { getApplicableRefactors, getEditForRefactors } from './index';
import { initRefactors } from './refactors/index';

function init(modules: { typescript: typeof tslib }) {
  const ts = modules.typescript;

  function create(info: tslib.server.PluginCreateInfo) {
    const availableRefactors = initRefactors(info);

    const proxy: ts.LanguageService = Object.create(null);
    for (let k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k];

      // @ts-ignore
      proxy[k] = (...args: Array<{}>) => x!.apply(info.languageService, args);
    }

    proxy.getApplicableRefactors = (
      fileName,
      positionOrRange
    ): tslib.ApplicableRefactorInfo[] => {
      const defaultRefactors =
        info.languageService.getApplicableRefactors(
          fileName,
          positionOrRange,
          undefined
        ) || [];

      return defaultRefactors.concat(
        getApplicableRefactors(availableRefactors, info, fileName, positionOrRange)
      );
    };

    proxy.getEditsForRefactor = (
      fileName: string,
      formatOptions: tslib.FormatCodeSettings,
      positionOrRange: number | tslib.TextRange,
      refactorName: string,
      actionName: string,
      preferences: tslib.UserPreferences | undefined
    ) => {
      const defaultRefactors = info.languageService.getEditsForRefactor(
        fileName,
        formatOptions,
        positionOrRange,
        refactorName,
        actionName,
        preferences
      );

      return (
        getEditForRefactors(
          availableRefactors,
          fileName,
          formatOptions,
          positionOrRange,
          refactorName,
          actionName,
          preferences
        ) || defaultRefactors
      );
    };

    return proxy;
  }

  return { create };
}

export = init;
