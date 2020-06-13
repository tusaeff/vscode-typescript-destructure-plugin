import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/Refactor';
import {
  getNodeByLocation,
  getNodeType,
  getTypeDestructuring,
  createTextEdit,
  isDestructurable,
} from '../utils';

const isPartOfSpread = (node: tslib.Node) => {
  return (
    node.parent
      .getChildren()
      .some((n) => n.kind === tslib.SyntaxKind.DotDotDotToken)
  );
};

export class DestructureProperty extends Refactor {
  name = ERefactorKind.destructurePropery;
  description = 'Вложенная деструктуризация';
  actions = [
    {
      name: ERefactorKind.destructurePropery,
      description: 'Destructure object property',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return node
      && tslib.isIdentifier(node)
      && tslib.isBindingElement(node.parent)
      && !isPartOfSpread(node)
      && isDestructurable(this.info, node);
  }

  apply(
    fileName: string,
    formatOptions: tslib.FormatCodeSettings,
    positionOrRange: number | tslib.TextRange,
    refactorName: string,
    actionName: string,
    preferences: tslib.UserPreferences | undefined
  ) {
    const node = getNodeByLocation(this.info, fileName, positionOrRange);
    const type = node && getNodeType(this.info, node);

    if (!node || !type) {
      return;
    }

    const newText = `${node.getText()}: {${getTypeDestructuring(type)}}`;

    return createTextEdit(fileName, positionOrRange, newText);
  }
}
