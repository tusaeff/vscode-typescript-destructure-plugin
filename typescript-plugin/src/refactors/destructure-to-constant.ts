import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/refactor';
import {
  getNodeByLocation,
  getNodeType,
  createTextEdit,
  isDestructurable,
  createObjectBindingPatternForType,
  findFunctionLikeParent,
  insertStatementAfter,
  replaceStatement,
  printNode,
  findNearestParentByGuards,
} from '../utils';

function appendStatementToBlockStart(
  block: tslib.Block,
  statement: tslib.Statement
) {
  return tslib.updateBlock(block, [statement, ...block.statements]);
}

/**
 * before: () => 2 + 2
 * after: () => {
 *   return 2 + 2;
 * }
 */
function updateArrowFunctionWithBlockBody(
  fn: tslib.ArrowFunction,
  statementsToAppendAtBlockStart: tslib.Statement[]
) {
  return tslib.updateArrowFunction(
    fn,
    fn.modifiers,
    fn.typeParameters,
    fn.parameters,
    fn.type,
    fn.equalsGreaterThanToken,
    tslib.createBlock(
      [
        ...statementsToAppendAtBlockStart,
        tslib.createReturn(
          fn.body as tslib.Expression // TODO: check if this assertion is valid
        ),
      ],
      /* multiline */ true
    )
  );
}

function createDestructuringVariableStatement(
  info: tslib.server.PluginCreateInfo,
  identifier: tslib.Node
) {
  const type = getNodeType(info, identifier);

  if (!type) {
    return undefined;
  }

  return tslib.createVariableStatement(
    /* modifiers */ undefined,
    tslib.createVariableDeclarationList(
      [
        tslib.createVariableDeclaration(
          createObjectBindingPatternForType(type),
          /* type */ undefined,
          identifier as tslib.Expression // TODO: check if this assertion is valid
        ),
      ],
      tslib.NodeFlags.Const
    )
  );
}

function appendStatementToFunctionBody(
  fn:
    | tslib.ArrowFunction
    | tslib.FunctionDeclaration
    | tslib.FunctionExpression,
  statement: tslib.Statement
) {
  const body = fn.body;

  if (body && tslib.isBlock(body)) {
    return appendStatementToBlockStart(body, statement);
  } else if (tslib.isArrowFunction(fn)) {
    return updateArrowFunctionWithBlockBody(fn, [statement]);
  } else {
    return undefined; // TODO: need to be handled properly
  }
}

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
    return (
      node &&
      isDestructurable(this.info, node) &&
      !tslib.isTypeReferenceNode(node.parent)
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

    const isFunctionParameter = findNearestParentByGuards(node, [
      tslib.isParameter,
    ]);
    const isObjectProperty = tslib.isBindingElement(node.parent);

    const destructuringVariableStatement = createDestructuringVariableStatement(
      this.info,
      node
    );

    if (!destructuringVariableStatement) {
      return undefined;
    }

    let updatedNode = null;

    if (isFunctionParameter) {
      const fn = findFunctionLikeParent(node);

      if (!fn) {
        console.error('ошибка 150')
        return;
      }

      updatedNode = appendStatementToFunctionBody(
        fn,
        destructuringVariableStatement
      );
    } else if (isObjectProperty) {
      const parentDeclaration = findNearestParentByGuards(node, [
        tslib.isVariableDeclaration,
      ]);

      if (!parentDeclaration) {
        console.error('ошибка 150')
        return;
      }

      updatedNode = insertStatementAfter(
        destructuringVariableStatement,
        parentDeclaration.parent.parent
      );
    } else {
      // если это не параметр в функции и не поле обьекта, значит это часть ExpressionStatement или VariableStatement
      const statementToReplace = findNearestParentByGuards(node, [
        tslib.isExpressionStatement,
        tslib.isVariableStatement,
        tslib.isReturnStatement,
      ]);

      if (!statementToReplace) {
        console.error('ошибка 150')
        return;
      }

      updatedNode = replaceStatement(
        destructuringVariableStatement,
        statementToReplace
      );
    }

    const newText = updatedNode && printNode(this.info, fileName, updatedNode);

    if (!updatedNode || !newText) {
      console.error('нет апдейтнутой ноды');
      return;
    }

    return createTextEdit(fileName, updatedNode, newText);
  }
}
