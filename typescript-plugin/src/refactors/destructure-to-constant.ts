import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/refactor';
import {
  getNodeByLocation,
  getNodeType,
  canBeDestructured,
  createObjectBindingPatternForType,
  findFunctionLikeParent,
  findNearestParentByGuards,
} from '../utils';
import { TextChanger } from '../common/changer';

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
  description = 'Destructure object';
  actions = [
    {
      name: ERefactorKind.destructureToConstant,
      description: 'Create destructuring assignment',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return (
      node &&
      canBeDestructured(this.info, node) &&
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
    const textChanger = new TextChanger(this.info, formatOptions);

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

    if (isFunctionParameter) {
      return this.handleFunctionParameter(
        node,
        destructuringVariableStatement,
        textChanger,
        fileName
      );
    } else if (isObjectProperty) {
      return this.handleObjectProperty(
        node,
        destructuringVariableStatement,
        textChanger,
        fileName
      );
    } else {
      return this.handleStatement(
        node,
        destructuringVariableStatement,
        textChanger,
        fileName
      );
    }
  }

  protected handleFunctionParameter(
    node: tslib.Node,
    statement: tslib.Statement,
    textChanger: TextChanger,
    fileName: string
  ) {
    const fn = findFunctionLikeParent(node);

    if (fn && fn.body && tslib.isBlock(fn.body)) {
      const firstStatement = fn.body.statements[0];

      if (firstStatement) {
        // trying to edit as little code as possible, so we should try not edit block itself
        return textChanger.insertNodeBefore(
          firstStatement,
          statement,
          fileName
        );
      } else {
        const updatedBlock = tslib.updateBlock(fn.body, [statement]);

        return textChanger.replaceNode(updatedBlock, updatedBlock, fileName, {
          incrementPos: true,
        });
      }
    } else if (fn && tslib.isArrowFunction(fn)) {
      let updatedNode = appendStatementToFunctionBody(fn, statement);

      return (
        updatedNode &&
        textChanger.replaceNode(updatedNode, updatedNode, fileName, {
          incrementPos: true,
        })
      );
    } else {
      return undefined;
    }
  }

  protected handleObjectProperty(
    node: tslib.Node,
    statement: tslib.Statement,
    textChanger: TextChanger,
    fileName: string
  ) {
    const parentDeclaration = findNearestParentByGuards(node, [
      tslib.isVariableDeclaration,
    ]);

    return (
      parentDeclaration &&
      textChanger.insertNodeAfter(
        parentDeclaration.parent.parent,
        statement,
        fileName
      )
    );
  }

  protected handleStatement(
    node: tslib.Node,
    statement: tslib.Statement,
    textChanger: TextChanger,
    fileName: string
  ) {
    const parentStatement = findNearestParentByGuards(node, [
      tslib.isExpressionStatement,
      tslib.isVariableStatement,
      tslib.isReturnStatement,
    ]);

    if (parentStatement && tslib.isVariableStatement(parentStatement)) {
      return textChanger.insertNodeAfter(parentStatement, statement, fileName);
    }

    return (
      parentStatement &&
      textChanger.replaceStatement(parentStatement, statement, fileName, {
        incrementPos: true,
      })
    );
  }
}
