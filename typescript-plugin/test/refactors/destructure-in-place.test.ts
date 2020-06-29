import {
  file,
  canBeAppliedAtSelection,
  applyAtSelection,
  withoutIndent,
} from '../framework';
import { Refactor } from '../../src/common/refactor';
import { DestructureInPlace } from '../../src/refactors/destructure-in-place';
import { setupRefactorTests } from './setupRefactorTests';

const ctx = setupRefactorTests(DestructureInPlace);

describe('Destructure function parameter', () => {
  let refactor: Refactor;

  beforeEach(() => {
    refactor = ctx.refactor;
  })

  it('Can be applied at function parameter', () => {
    const mock = file`
      type IObject = { property1: number }
      
      const fn = (#parameter#: IObject) => {}
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Cannot be applied at function parameter with no object type', () => {
    const mock = file`
      const fn = (#parameter#: number) => {}
    `;

    // TODO: canBeApplied should return boolean
    expect(Boolean(canBeAppliedAtSelection(refactor, mock))).toBe(false);
  });

  it('Is valid transformation', () => {
    const mock = file`
      type IObject = { property1: number }

      const fn = (#parameter#: IObject) => {}
    `;

    const expected = withoutIndent`
      type IObject = { property1: number }

      const fn = ({ property1 }: IObject) => {}
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });
});
