import * as ts_module from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from "../common/Refactor";
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit } from '../utils'

export class DestructureInPlace extends Refactor {
  name = ERefactorKind.destructureInPlace;
  description = 'Деструктурировать обьект на месте';
  actions = [
    {
      name: ERefactorKind.destructureInPlace,
      description: 'Destructure object (inplace)',
    },
  ];

  canBeApplied(node?: ts_module.Node) {
    return (
      node &&
      node.kind === ts_module.SyntaxKind.Identifier &&
      node.parent.kind === ts_module.SyntaxKind.Parameter
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

    const destructStatement = `{ ${ getTypeDestructuring(type) } }`;

    return createTextEdit(
      fileName,
      positionOrRange,
      destructStatement || ''
    );
  }
}
