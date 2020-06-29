import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/Refactor';
import {
  getNodeByLocation,
  getNodeType,
  canBeDestructured,
  createObjectBindingPatternForType,
} from '../utils';
import { TextChanger } from '../common/changer';

const isPartOfSpread = (node: tslib.Node) => {
  return node.parent
    .getChildren()
    .some((n) => n.kind === tslib.SyntaxKind.DotDotDotToken);
};

export class DestructureProperty extends Refactor {
  name = ERefactorKind.destructurePropery;
  description = 'Destructure object property';
  actions = [
    {
      name: ERefactorKind.destructurePropery,
      description: 'Destructure object property',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return (
      node &&
      tslib.isIdentifier(node) &&
      tslib.isBindingElement(node.parent) &&
      !isPartOfSpread(node) &&
      canBeDestructured(this.info, node)
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

    const oldBindingElement = node.parent as tslib.BindingElement;

    const textChanger = new TextChanger(this.info, formatOptions);
    const updatedBindingElement = tslib.updateBindingElement(
      oldBindingElement,
      undefined,
      (createObjectBindingPatternForType(type) as unknown) as tslib.Identifier, // TODO: FIXME
      oldBindingElement.name,
      undefined
    );

    return textChanger.replaceNode(
      oldBindingElement,
      updatedBindingElement,
      fileName,
      { incrementPos: true }
    );
  }
}
