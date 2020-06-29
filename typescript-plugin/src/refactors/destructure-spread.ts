import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/Refactor';
import {
  getNodeByLocation,
  getNodeType,
  canBeDestructured,
} from '../utils';
import { TextChanger } from '../common/changer';

const getElements = (node: tslib.Node) => {
  if (tslib.isBindingElement(node)) {
    const children = node.getChildren();

    return {
      bindingElement: node,
      identifier: children.find((n) => tslib.isIdentifier(n)),
      dotDotToken: children.find(
        (n) => n.kind === tslib.SyntaxKind.DotDotDotToken
      ),
    };
  } else if (tslib.isIdentifier(node)) {
    return {
      bindingElement: node.parent as tslib.BindingElement,
      identifier: node,
      dotDotToken: node.parent
        .getChildren()
        .find((n) => n.kind === tslib.SyntaxKind.DotDotDotToken),
    };
  } else if (node.kind === tslib.SyntaxKind.DotDotDotToken) {
    return {
      bindingElement: node.parent as tslib.BindingElement,
      identifier: node.parent.getChildren().find(tslib.isIdentifier),
      dotDotToken: node,
    };
  }

  return {};
};

const createBindingElementsForType = (type: tslib.Type) => {
  return type
    .getProperties()
    .map((property) =>
      tslib.createBindingElement(undefined, undefined, property.getName())
    );
};

export class DestructureSpread extends Refactor {
  name = ERefactorKind.destructureSpread;
  description = 'Destructure spread';
  actions = [
    {
      name: ERefactorKind.destructureSpread,
      description: 'Unfold the rest operator',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    if (!node) {
      return;
    }

    const { bindingElement, dotDotToken, identifier } = getElements(node);

    return (
      bindingElement && dotDotToken && canBeDestructured(this.info, identifier)
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

    if (!node) {
      return;
    }

    const textChanger = new TextChanger(this.info, formatOptions);

    const { identifier, bindingElement, dotDotToken } = getElements(node);
    const identifierType = identifier && getNodeType(this.info, identifier);

    if (!identifier || !identifierType || !bindingElement) {
      return;
    }

    const bindingPattern = bindingElement.parent;

    if (tslib.isObjectBindingPattern(bindingPattern)) {
      const updatedNode = tslib.updateObjectBindingPattern(bindingPattern, [
        ...bindingPattern.elements.filter((elm) => elm !== bindingElement),
        ...createBindingElementsForType(identifierType),
      ]);

      return textChanger.replaceNode(updatedNode, updatedNode, fileName, {
        incrementPos: true,
      });
    }
  }
}
