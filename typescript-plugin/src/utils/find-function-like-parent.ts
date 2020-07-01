import * as tslib from 'typescript/lib/tsserverlibrary';
import { findNearestParentByGuards } from './find-nearest-parent-by-guards';

export function findFunctionLikeParent(node: tslib.Node) {
  return findNearestParentByGuards(node, [
    tslib.isFunctionDeclaration,
    tslib.isFunctionExpression,
    tslib.isArrowFunction,
  ]);
}
