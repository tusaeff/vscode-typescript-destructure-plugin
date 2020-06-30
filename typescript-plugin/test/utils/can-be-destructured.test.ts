import { canBeDestructured, findChildContainingPosition, positionOrRangeToNumber } from "../../src/utils";
import {
  Framework,
  file,
  initFramework,
  MockFile,
} from '../framework';

let framework!: Framework;

beforeAll(() => {
  framework = initFramework();
});

afterEach(() => {
  framework?.flushFiles();
});

describe('canBeDestructured', () => {
  const nodeAtSelectionCanBeDestructured = (file: MockFile) => {
    const { languageService } = framework;
    const program = languageService.getProgram();
    const sourceFile = program?.getSourceFile(file.name);

    if (!sourceFile) return;

    const range = file.getSelection();
    const node = findChildContainingPosition(sourceFile, positionOrRangeToNumber(range));

    // console.log(node);

    return canBeDestructured(framework.getPluginCreateInfo(), node);
  }

  it('Simple type cannot be destructured', () => {
    const mock = file`
      const variable = 3;

      #variable#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(false);
  })

  it('Object can be destructured', () => {
    const mock = file`
      const variable = { key: 'value' };

      #variable#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(true);
  })

  it.skip('Array cannot be destructured', () => {
    const mock = file`
      function(p: number[]) {
        #p#
      }
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(false);
  })

  it('Union type with not only object members cannot be destructured', () => {
    const mock = file`
      function(p: number | { key: 'value' }) {

        #p#
      }
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(false);
  })

  // because we don't know which object from union to destructure
  it('Union type with only object members cannot be destructured', () => {
    const mock = file`
      function(p: { key1: 'value1' } | { key2: 'value2' }) {

        #p#;
      }
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(false);
  })

  it('Intersection type can be destructured', () => {
    const mock = file`
      function(p: { key1: 'value1' } & { key2: 'value2' }) {
        #p#;
      }
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(true);
  })

  it('Class instance can be destructured', () => {
    const mock = file`
      class Test {
        property = 1;
      }

      const test = new Test;

      #test#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(true);
  })

  it('Class can be destructured', () => {
    const mock = file`
      class Test {
        property = 1;
      }

      #Test#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(true);
  })

  it.skip('Object literal can be destructured', () => {
    const mock = file`
      #{ a: 1, b: 2 }#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(true);
  })

  it('Type node cannot be destructured', () => {
    const mock = file`
      interface IInt {
        key: string;
      }

      #IInt#
    `

    expect(nodeAtSelectionCanBeDestructured(mock)).toBe(false);
  })
})
