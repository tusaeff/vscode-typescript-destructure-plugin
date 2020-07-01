import {
  file,
  canBeAppliedAtSelection,
  applyAtSelection,
  withoutIndent,
} from '../framework';
import { DestructureToConstant } from '../../src/refactors/destructure-to-constant';
import { Refactor } from '../../src/common/refactor';
import { setupRefactorTests } from './setupRefactorTests';

const ctx = setupRefactorTests(DestructureToConstant);

describe('Create destructuring assignment', () => {
  let refactor: Refactor;

  beforeEach(() => {
    refactor = ctx.refactor;
  });

  it('Can be applied at expression', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;

      #obj#
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Can be applied at function argument', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      function (#arg#: IObject) {}
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Can be applied at object property', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;
      const acc = { obj };

      const {
        #obj#
      } = acc;
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Performs valid transformation at expression', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;

      #obj#
    `;

    const expected = withoutIndent`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;
      const {
        property1,
        property2,
        property3
      } = obj;
      `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });

  it('Performs valid transformation at function argument with block body', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      function (#parameter#: IObject) {}
    `;

    const expected = withoutIndent`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      function (parameter: IObject) {
        const {
          property1,
          property2,
          property3
        } = parameter;
      }
    `;

    expect(applyAtSelection(refactor, mock)).toBe(expected);
  });

  it('Performs valid transformation at function argument without block body', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const fn = (#parameter#: IObject) => parameter;
    `;

    const expected = withoutIndent`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const fn = (parameter: IObject) => {
        const {
          property1,
          property2,
          property3
        } = parameter;
        return parameter;
      };
    `;

    expect(applyAtSelection(refactor, mock)).toBe(expected);
  });

  it('Performs valid transformation at object property', () => {
    const mock = file`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;
      const acc = { obj };

      const {
        #obj#
      } = acc;
    `;

    const expected = withoutIndent`
      interface IObject {
        property1: number;
        property2: string;
        property3: boolean;
      }

      const obj = {} as IObject;
      const acc = { obj };

      const {
        obj
      } = acc;
      const {
        property1,
        property2,
        property3
      } = obj;
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });
});
