import * as tslib from 'typescript/lib/tsserverlibrary';
import { nanoid } from 'nanoid';
import { Refactor } from '../src/common/refactor';
import {
  findChildContainingPosition,
  positionOrRangeToNumber,
} from '../src/utils';

export const TEST_FILENAME = 'test.ts';

export class LanguageServiceHostMock implements tslib.LanguageServiceHost {
  public files: MockFile[] = [new MockFile(TEST_FILENAME, '')];

  getCompilationSettings() {
    return {};
  }

  getScriptFileNames() {
    return [...this.files.map((f) => f.name)];
  }

  getScriptVersion() {
    return 'v0.0.0';
  }

  getScriptSnapshot(fileName: string) {
    return this.files.find((file) => file.name === fileName);
  }

  getCurrentDirectory() {
    return 'src';
  }

  getDefaultLibFileName() {
    return 'ts';
  }
}

export class MockFile {
  constructor(public name: string, public text: string) {}

  public selectionSymbol = '#';

  getText(start: number, end: number): string {
    return this.text
      .slice(start, end)
      .replace(new RegExp(this.selectionSymbol, 'g'), '');
  }

  getLength() {
    return this.text.length;
  }

  getChangeRange(oldSnapshot: tslib.IScriptSnapshot) {
    return undefined; // TODO: verify
  }

  getSelection(): number | tslib.TextRange {
    const [start, end] = [
      this.text.indexOf(this.selectionSymbol),
      this.text.lastIndexOf(this.selectionSymbol),
    ];

    // if (start === -1) {
    //   return undefined;
    // }

    if (start === end) {
      return start - 1;
    }

    return {
      pos: start,
      end: end - 1,
    };
  }
}

// TODO: fix bug with wrong types if not flushing files
export class Framework {
  public languageServiceHost = new LanguageServiceHostMock();
  public languageService = tslib.createLanguageService(
    this.languageServiceHost
  );

  addFile(file: MockFile) {
    this.languageServiceHost.files.push(file);
  }

  removeFile(file: MockFile) {
    this.languageServiceHost.files = this.languageServiceHost.files.filter((f) => f !== file);
  }

  flushFiles() {
    this.languageServiceHost.files = this.languageServiceHost.files.filter((f) => f.name === TEST_FILENAME);
  }

  getPluginCreateInfo(): tslib.server.PluginCreateInfo {
    const { languageService, languageServiceHost } = this;

    return {
      languageService,
      languageServiceHost,
    } as any;
  }
}

let framework: Framework | null = null;

export function initFramework(): Framework {
  framework = new Framework();

  return framework;
}

export const getPluginCreateInfo = (): tslib.server.PluginCreateInfo => {
  const languageServiceHost = new LanguageServiceHostMock();
  const languageService = tslib.createLanguageService(languageServiceHost);

  return {
    languageService,
    languageServiceHost,
  } as any;
};

export const file = (strings: TemplateStringsArray, ...values: any[]) => {
  const text = strings.map((s, index) => s + (values[index] || '')).join('');
  const name = nanoid() + '.ts';

  const mockFile = new MockFile(name, withoutIndentFn(text));

  if (framework) {
    framework.addFile(mockFile);
  }

  return mockFile;
};

export const withoutIndentFn = (text: string) => {
  const lines = text.split('\n');
  const baseIndent = calculateBaseIndent(lines);

  return lines
    .map((line) => line.slice(baseIndent))
    .join('\n')
    .trim();
}

export const withoutIndent = (
  strings: TemplateStringsArray,
  ...values: any[]
) => {
  const text = strings.map((s, index) => s + (values[index] || '')).join('');

  return withoutIndentFn(text);
};

const calculateBaseIndent = (lines: string[]) => {
  return lines.reduce((acc, line) => {
    let spacesCount = line.search(/\S/);

    if (spacesCount === -1 || acc < spacesCount) return acc;

    if (spacesCount <= acc) return spacesCount;

    return acc;
  }, Infinity);
};

export const canBeAppliedAtSelection = (refactor: Refactor, file: MockFile) => {
  const info = framework!.getPluginCreateInfo();
  const program = info.languageService.getProgram();
  const sourceFile = program?.getSourceFile(file.name);

  if (!sourceFile || !program) {
    return;
  }

  const node = findChildContainingPosition(
    sourceFile,
    positionOrRangeToNumber(file.getSelection())
  );

  return refactor.canBeApplied(node, file.name, file.getSelection());
};

export const applyAtSelection = (refactor: Refactor, file: MockFile) => {
  const edit = refactor.apply(
    file.name,
    { indentSize: 2 },
    file.getSelection(),
    refactor.name,
    refactor.name,
    undefined
  );

  if (!edit) {
    return file.getText(0, file.getLength());
  }

  if (edit) {
    let text = file.getText(0, file.getLength());

    edit.edits.forEach((e) => {
      e.textChanges.forEach((c) => {
        text =
          text.slice(0, c.span.start) +
          c.newText +
          text.slice(c.span.start + c.span.length);
      });
    });

    return text;
  }
};
