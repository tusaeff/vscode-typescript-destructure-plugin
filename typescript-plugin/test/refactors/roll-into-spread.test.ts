import { file, canBeAppliedAtSelection, applyAtSelection } from '../framework';
import { Refactor } from '../../src/common/refactor';
import { RollIntoSpread } from '../../src/refactors/roll-into-spread';
import { setupRefactorTests } from './setupRefactorTests';

const ctx = setupRefactorTests(RollIntoSpread);

describe('Collapse into rest operator', () => {
  let refactor: Refactor;

  beforeEach(() => {
    refactor = ctx.refactor;
  });

  it('Can be applied at object properties', () => {
    const mock = file`
      const { property1, #property2, property3# } = { property1: 1, property2: 2, property3 };
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Cannot be applied inside array', () => {
    const mock = file`
      const [#a, b, c#] = [1, 2, 3];
    `;

    // TODO: canBeApplied should return boolean
    expect(Boolean(canBeAppliedAtSelection(refactor, mock))).toBe(false);
  });

  it('Performs valid transformation', () => {
    const mock = file`
      const { property1, #property2, property3# } = { property1: 1, property2: 2, property3 };
    `;

    const expected = `
      const { property1, ...rest } = { property1: 1, property2: 2, property3 };
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });
});
