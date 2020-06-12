import * as ts_module from 'typescript/lib/tsserverlibrary';
import { Refactor } from '../common/refactor';
import { DestructureProperty } from './destructure-property';
import { DestructureInPlace } from './destructure-in-place';
import { DestructureSpread } from './destructure-spread';
import { DestructureToConstant } from './destructure-to-constant';

export const availableRefactors: Refactor[] = [];

export const initRefactors = (info: ts_module.server.PluginCreateInfo) => {
  const availableRefactorsClasses = [
    DestructureProperty,
    DestructureInPlace,
    DestructureSpread,
    DestructureToConstant
  ]

  availableRefactorsClasses.forEach((claz) => {
    availableRefactors.push(new claz(info));
  })
}