import * as ts_module from 'typescript/lib/tsserverlibrary';
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

  canBeApplied(node?: ts_module.Node) {
    return (
      node &&
      node.kind === ts_module.SyntaxKind.Identifier &&
      node.parent.kind === ts_module.SyntaxKind.BindingElement
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

    const newText = `${node.getText()}: {${getTypeDestructuring(type)}}`;

    return createTextEdit(fileName, positionOrRange, newText);
  }
}