import {
  file,
  canBeAppliedAtSelection,
  applyAtSelection,
  withoutIndent,
} from '../framework';
import { Refactor } from '../../src/common/refactor';
import { DestructureProperty } from '../../src/refactors/destructure-property';
import { setupRefactorTests } from './setupRefactorTests';

const ctx = setupRefactorTests(DestructureProperty);

describe('Destructure object property', () => {
  let refactor: Refactor;

  beforeEach(() => {
    refactor = ctx.refactor;
  })


  it('Can be applied at object property', () => {
    const mock = file`
      const { #nestedProperty# } = { nestedProperty: { nestedValue: 'value' } };
    `;

    expect(canBeAppliedAtSelection(refactor, mock)).toBe(true);
  });

  it('Cannot be applied at object property with no object type', () => {
    const mock = file`
      const { #notNestedProperty# } = { notNestedProperty: 1 };
    `;

    // TODO: canBeApplied should return boolean
    expect(Boolean(canBeAppliedAtSelection(refactor, mock))).toBe(false);
  });

  it('Performs valid transformation', () => {
    const mock = file`
      const { #nestedProperty# } = { nestedProperty: { nestedValue: 'value' } };
    `;

    const expected = `
      const { nestedProperty: { nestedValue } } = { nestedProperty: { nestedValue: 'value' } };
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });

  it('Performs valid transformation with multiline objects', () => {
    const mock = file`
      const {
        #nestedProperty#,
        property2
      } = { nestedProperty: { nestedValue: 'value' }, property2: 2 };
    `;

    const expected = withoutIndent`
      const {
        nestedProperty: { nestedValue },
        property2
      } = { nestedProperty: { nestedValue: 'value' }, property2: 2 };
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });

  it('Performs valid transformation with last property in multiline objects', () => {
    const mock = file`
      const {
        property2,
        #nestedProperty#
      } = { nestedProperty: { nestedValue: 'value' }, property2: 2 };
    `;

    const expected = withoutIndent`
      const {
        property2,
        nestedProperty: { nestedValue }
      } = { nestedProperty: { nestedValue: 'value' }, property2: 2 };
    `;

    expect(applyAtSelection(refactor, mock)?.trim()).toBe(expected.trim());
  });
});
