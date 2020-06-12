import * as ts_module from 'typescript/lib/tsserverlibrary';
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

  canBeApplied(node?: ts_module.Node) {
    return (
      node &&
      node.kind === ts_module.SyntaxKind.Identifier &&
      node.parent.kind === ts_module.SyntaxKind.BindingElement
      && node.parent.getChildren(node.getSourceFile()).some((sibling) => sibling.kind === ts_module.SyntaxKind.DotDotDotToken)
    );
  }

  apply(
    fileName: string,
    formatOptions: ts_module.FormatCodeSettings,
    positionOrRange: number | ts_module.TextRange,
    refactorName: string,
    actionName: string,
    preferences: ts_module.UserPreferences | undefined
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