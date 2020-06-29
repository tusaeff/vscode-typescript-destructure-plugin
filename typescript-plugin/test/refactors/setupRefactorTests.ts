import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor } from "../../src/common/refactor"
import { Framework, initFramework } from "../framework";

export function setupRefactorTests(RefactorClass: { new(info: tslib.server.PluginCreateInfo): Refactor }) {
  const acc = {
    framework: null,
    refactor: null,
  } as unknown as {
    refactor: Refactor,
    framework: Framework,
  };

  beforeAll(() => {
    acc.framework = initFramework();
  });

  afterEach(() => {
    acc.framework?.flushFiles();
  });

  beforeEach(() => {
    acc.refactor = new RefactorClass(acc.framework.getPluginCreateInfo());
  });

  return acc;
}