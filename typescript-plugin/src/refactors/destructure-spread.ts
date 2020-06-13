import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from "../common/Refactor";
import { getNodeByLocation, getNodeType, getTypeDestructuring, createTextEdit, isDestructurable } from '../utils'


const getElements = (node: tslib.Node) => {
  if (tslib.isBindingElement(node)) {
    const children = node.getChildren();

    return {
      bindingElement: node,
      identifier: children.find(n => tslib.isIdentifier(n)),
      dotDotToken: children.find(n => n.kind === tslib.SyntaxKind.DotDotDotToken),
    }
    
  } else if (tslib.isIdentifier(node)) {
    return {
      bindingElement: node.parent,
      identifier: node,
      dotDotToken: node.parent.getChildren().find(n => n.kind === tslib.SyntaxKind.DotDotDotToken),
    }
  } else if (node.kind === tslib.SyntaxKind.DotDotDotToken) {
    return {
      bindingElement: node.parent,
      identifier: node.parent.getChildren().find(tslib.isIdentifier),
      dotDotToken: node,
    }
  }

  return {};
}

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
    if (!node) {
      return;
    }

    const {
      bindingElement,
      dotDotToken,
      identifier
    } = getElements(node)

    return bindingElement && dotDotToken && isDestructurable(this.info, identifier);
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

    if (!node) {
      return;
    }

    const {
      identifier,
      bindingElement
    } = getElements(node);
    const identifierType = identifier && getNodeType(this.info, identifier);

    if (!identifier || !identifierType || !bindingElement) {
      return;
    }

    let newText = getTypeDestructuring(identifierType) || '';

    newText = newText
      .trim()
      .replace(/\/n$/, '')

    newText = '\n' + newText;

    const range = {
      pos: bindingElement.pos,
      end: bindingElement.end,
    };

    return createTextEdit(fileName, range, newText || '');
  }
}