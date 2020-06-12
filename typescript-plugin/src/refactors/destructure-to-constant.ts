import * as ts_module from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/refactor';
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit } from '../utils'

export class DestructureToConstant extends Refactor {
  name = ERefactorKind.destructureToConstant;
  description = 'Деструктурировать обьект в отдельную константу';
  actions = [
    {
      name: ERefactorKind.destructureToConstant,
      description: 'Destructure object',
    },
  ];

  canBeApplied(node?: ts_module.Node) {
    return node && node.kind === ts_module.SyntaxKind.Identifier;
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

    const destructStatement = getTypeDestructuring(type);
    const renameTo = `const { ${destructStatement} } = ${node.getText()}`;

    return createTextEdit(fileName, positionOrRange, renameTo);
  }
}