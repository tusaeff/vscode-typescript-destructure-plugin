import {
  file,
  canBeAppliedAtSelection,
  applyAtSelection,
  withoutIndent,
} from '../framework';
import { DestructureSpread } from '../../src/refactors/destructure-spread';
import { setupRefactorTests } from './setupRefactorTests';

const ctx = setupRefactorTests(DestructureSpread);

describe('Unfold the rest operator', () => {
  it('Can be applied at rest operator binding element', () => {
    const { refactor } = ctx;
    const mock = file`
      const { #...rest# } = { property1: 1, property2: 2 };
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Can be applied at rest operator dotdotdottoken', () => {
    const { refactor } = ctx;
    const mock = file`
      const { #...#rest } = { property1: 1, property2: 2 };
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Can be applied at rest operator identifier', () => {
    const { refactor } = ctx;
    const mock = file`
      const { ...#rest# } = { property1: 1, property2: 2 };
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Cannot be applied inside array', () => {
    const { refactor } = ctx;
    const mock = file`
      const [#...rest#] = [1, 2, 3];
    `;

    // TODO: canBeApplied should return boolean
    expect(Boolean(canBeAppliedAtSelection(refactor, mock))).toBe(false);
  });

  it('Performs valid transformation', () => {
    const { refactor } = ctx;
    const mock = file`
      const { #...rest# } = { property1: 1, property2: 2 };
    `;

    const expected = withoutIndent`
      const {
        property1,
        property2
      } = { property1: 1, property2: 2 };
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });
});
