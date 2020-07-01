import * as tslib from 'typescript/lib/tsserverlibrary';

export function createObjectBindingPatternForType(type: tslib.Type) {
  const bindings = type
    .getProperties()
    .map((p) => tslib.createBindingElement(undefined, undefined, p.getName()));

  return tslib.createObjectBindingPattern(bindings);
}
