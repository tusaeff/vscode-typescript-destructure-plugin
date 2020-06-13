import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from "../common/Refactor";
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit } from '../utils'

export class DestructureSpread extends Refactor {
  name = ERefactorKind.destructureSpread;
  description = 'Вложенная деструктуризация';
  actions = [
    {
      name: ERefactorKind.destructureSpread,
      description: 'Destructure spread',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return (
      node &&
      node.kind === tslib.SyntaxKind.Identifier &&
      node.parent.kind === tslib.SyntaxKind.BindingElement
      && node.parent.getChildren(node.getSourceFile()).some((sibling) => sibling.kind === tslib.SyntaxKind.DotDotDotToken)
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

    let newText = getTypeDestructuring(type) || '';

    newText = newText
      .trim()
      .replace(/\/n$/, '')
      .replace(/^\/n/, '');

    const range = {
      pos: node.parent.getStart(),
      end: node.parent.getEnd(),
    };

    return createTextEdit(fileName, range, newText || '');
  }
}