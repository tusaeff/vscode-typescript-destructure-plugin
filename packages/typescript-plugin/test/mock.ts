import * as tslib from 'typescript/lib/tsserverlibrary';

export const TEST_FILENAME = 'test.ts';

export class LanguageServiceHostMock implements tslib.LanguageServiceHost {
  getCompilationSettings() {
    return {};
  }

  getScriptFileNames() {
    return [TEST_FILENAME];
  }

  getScriptVersion() {
    return 'v0.0.0';
  }

  getScriptSnapshot(fileName: string) {
    return {
      getText(start: number, end: number): string {
        return '';
      },
      getLength(): number {
        return 0;
      },
      getChangeRange(
        oldSnapshot: tslib.IScriptSnapshot
      ): tslib.TextChangeRange | undefined {
        return undefined;
      },
    };
  }

  getCurrentDirectory() {
    return 'src';
  }

  getDefaultLibFileName() {
    return 'ts';
  }
}

export const getPluginCreateInfo = (): tslib.server.PluginCreateInfo => {
  const languageServiceHost = new LanguageServiceHostMock();
  const languageService = tslib.createLanguageService(languageServiceHost);

  return {
    languageService,
    languageServiceHost,
  } as any;
}
