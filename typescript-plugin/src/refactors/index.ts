import * as tslib from 'typescript/lib/tsserverlibrary';
import { DestructureProperty } from './destructure-property';
import { DestructureInPlace } from './destructure-in-place';
import { DestructureSpread } from './destructure-spread';
import { DestructureToConstant } from './destructure-to-constant';
import { RollIntoSpread } from './roll-into-spread';

export const initRefactors = (info: tslib.server.PluginCreateInfo) => {
  const availableRefactorsClasses = [
    DestructureProperty,
    DestructureInPlace,
    DestructureSpread,
    DestructureToConstant,
    RollIntoSpread,
  ];

  return availableRefactorsClasses.map((claz) => new claz(info));
};
