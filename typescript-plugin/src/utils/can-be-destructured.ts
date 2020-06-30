import * as tslib from 'typescript/lib/tsserverlibrary';
import { getNodeType } from './get-node-type';

const contextsKindsWithForbiddenDestructure = [
  tslib.SyntaxKind.PropertyAssignment,
  tslib.SyntaxKind.PropertyDeclaration,
];

export function canBeDestructured(
  info: tslib.server.PluginCreateInfo,
  node?: tslib.Node
) {
  const isIdentifier = node && node.kind === tslib.SyntaxKind.Identifier;
  const type = isIdentifier && getNodeType(info, node!);

  if (type) {
    // seems like typescript has some lazy evaluation mechanism around object types
    // without this getProperties call objectFlags aren't set on recently added identifiers
    // TODO: check ts code to find out the cause of this bug.
    type.getProperties();
  }

  const isObject = type && (type as tslib.ObjectType).objectFlags; // TODO: validate work with objectFlags

  const isUnion = type && type.isUnion();

  const isContextForbidden =
    !node ||
    contextsKindsWithForbiddenDestructure.indexOf(node.parent.kind) !== -1;

  return Boolean(isIdentifier && isObject && !isContextForbidden && !isUnion);
}
