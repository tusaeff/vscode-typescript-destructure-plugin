import * as tslib from 'typescript/lib/tsserverlibrary';

export type KindGuard<SpecificNode extends tslib.Node> = (
  node: tslib.Node
) => node is SpecificNode;

export function findNearestParentByGuards<S1 extends tslib.Node>(
  node: tslib.Node,
  guards: [KindGuard<S1>]
): undefined | S1;

export function findNearestParentByGuards<
  S1 extends tslib.Node,
  S2 extends tslib.Node
>(
  node: tslib.Node,
  guards: [KindGuard<S1>, KindGuard<S2>]
): undefined | S1 | S2;

export function findNearestParentByGuards<
  S1 extends tslib.Node,
  S2 extends tslib.Node,
  S3 extends tslib.Node
>(
  node: tslib.Node,
  guards: [KindGuard<S1>, KindGuard<S2>, KindGuard<S3>]
): undefined | S1 | S2 | S3;

export function findNearestParentByGuards<
  S1 extends tslib.Node,
  S2 extends tslib.Node,
  S3 extends tslib.Node,
  S4 extends tslib.Node
>(
  node: tslib.Node,
  guards: [KindGuard<S1>, KindGuard<S2>, KindGuard<S3>, KindGuard<S4>]
): undefined | S1 | S2 | S3 | S4;

export function findNearestParentByGuards<
  S1 extends tslib.Node,
  S2 extends tslib.Node,
  S3 extends tslib.Node,
  S4 extends tslib.Node,
  S5 extends tslib.Node
>(
  node: tslib.Node,
  guards: [
    KindGuard<S1>,
    KindGuard<S2>,
    KindGuard<S3>,
    KindGuard<S4>,
    KindGuard<S5>
  ]
): undefined | S1 | S2 | S3 | S4 | S5;

export function findNearestParentByGuards<
  S1 extends tslib.Node,
  S2 extends tslib.Node,
  S3 extends tslib.Node,
  S4 extends tslib.Node,
  S5 extends tslib.Node,
  S6 extends tslib.Node
>(
  node: tslib.Node,
  guards: [
    KindGuard<S1>,
    KindGuard<S2>,
    KindGuard<S3>,
    KindGuard<S4>,
    KindGuard<S5>,
    KindGuard<S6>
  ]
): undefined | S1 | S2 | S3 | S4 | S5 | S6;

export function findNearestParentByGuards(node: tslib.Node, guards: any[]) {
  if (!node.parent) {
    return;
  }

  const matched = guards.some((g) => g(node.parent));

  return matched
    ? node.parent
    : findNearestParentByGuards(node.parent, guards as any);
}
