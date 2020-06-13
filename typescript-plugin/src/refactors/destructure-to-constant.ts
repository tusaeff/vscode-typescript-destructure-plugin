import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/refactor';
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit, traverseParents, isDestructurable } from '../utils'


export class DestructureToConstant extends Refactor {
  name = ERefactorKind.destructureToConstant;
  description = 'Деструктурировать обьект в отдельную константу';
  actions = [
    {
      name: ERefactorKind.destructureToConstant,
      description: 'Destructure object',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return isDestructurable(this.info, node);
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

    const destructStatement = getTypeDestructuring(type);
    const renameTo = `const { ${destructStatement} } = ${node.getText()}`;

    const isFunctionParameter = tslib.isParameter(node.parent);
    const isBindingElement = tslib.isBindingElement(node.parent);
    
    if (isFunctionParameter) {
      const fnDecl = traverseParents(node, (parent) => (
        tslib.isFunctionDeclaration(parent)
        || tslib.isFunctionExpression(parent)
        || tslib.isArrowFunction(parent)
      ))

      const nodes = fnDecl.getChildren();
      const block = nodes.find(n => tslib.isBlock(n));

      if (block) {
        return createTextEdit(fileName, block.pos + 2, `\n${renameTo}\n`);
      } else if (tslib.isArrowFunction(fnDecl)) {
        const arrowIndex = nodes.findIndex(n => n.kind === tslib.SyntaxKind.EqualsGreaterThanToken);

        if (arrowIndex === -1) {
          return
        }

        const arrow = nodes[arrowIndex];
        const afterArrow = nodes.slice(arrowIndex + 1);
        const oldReturn = afterArrow.reduce((text, node) => text + node.getText(), '');
        const newText = `{\n ${renameTo}; \n\n return ${oldReturn} \n}`;

        return createTextEdit(fileName, { pos: arrow.end + 1, end: afterArrow[0].end }, newText);
      } else {
        return;
      }
    } else if (isBindingElement) {
      const variableDecl = traverseParents(node, (parent) => (
        tslib.isVariableDeclaration(parent)
      ))

      if (!variableDecl) {
        return
      }

      return createTextEdit(fileName, variableDecl.end + 1, '\n\n' + renameTo);
    }
  

    return createTextEdit(fileName, positionOrRange, renameTo);
  }
}