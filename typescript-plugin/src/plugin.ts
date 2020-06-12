import * as ts_module from 'typescript/lib/tsserverlibrary';
import { getApplicableRefactors, getEditForRefactors } from './index';
import { initRefactors } from './refactors/index';

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript;

  function create(info: ts_module.server.PluginCreateInfo) {
    initRefactors(info);

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
    ): ts_module.ApplicableRefactorInfo[] => {
      const defaultRefactors =
        info.languageService.getApplicableRefactors(
          fileName,
          positionOrRange,
          undefined
        ) || [];

      return defaultRefactors.concat(
        getApplicableRefactors(info, fileName, positionOrRange)
      );
    };

    proxy.getEditsForRefactor = (
      fileName: string,
      formatOptions: ts_module.FormatCodeSettings,
      positionOrRange: number | ts_module.TextRange,
      refactorName: string,
      actionName: string,
      preferences: ts_module.UserPreferences | undefined
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
