import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from "../common/Refactor";
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit } from '../utils'

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
    return (
      node &&
      node.kind === tslib.SyntaxKind.Identifier &&
      node.parent.kind === tslib.SyntaxKind.BindingElement
    );
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