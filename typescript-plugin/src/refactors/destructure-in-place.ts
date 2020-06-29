import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/Refactor';
import {
  getNodeByLocation,
  getNodeType,
  createObjectBindingPatternForType,
  canBeDestructured,
} from '../utils';
import { TextChanger } from '../common/changer';

export class DestructureInPlace extends Refactor {
  name = ERefactorKind.destructureInPlace;
  description = 'Destructure object in place';
  actions = [
    {
      name: ERefactorKind.destructureInPlace,
      description: 'Destructure function parameter',
    },
  ];

  canBeApplied(node?: tslib.Node) {
    return (
      node &&
      canBeDestructured(this.info, node) &&
      tslib.isParameter(node.parent)
    );
  }

  apply(
    fileName: string,
    formatOptions: tslib.FormatCodeSettings,
    positionOrRange: number | tslib.TextRange,
    refactorName: string,
    actionName: string,
    preferences: tslib.UserPreferences | undefined
  ): tslib.RefactorEditInfo | undefined {
    const node = getNodeByLocation(this.info, fileName, positionOrRange);
    const type = node && getNodeType(this.info, node);

    if (!node || !type) {
      return;
    }

    const bindingPatternNode = createObjectBindingPatternForType(type);
    const textChanger = new TextChanger(this.info, formatOptions);

    return textChanger.replaceNode(node, bindingPatternNode, fileName);
  }
}
