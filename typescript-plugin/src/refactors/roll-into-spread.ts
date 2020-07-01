import * as tslib from 'typescript/lib/tsserverlibrary';
import { Refactor, ERefactorKind } from '../common/refactor';
import { findAllNodesInRange } from '../utils';
import { Printer } from '../common/printer';
import { TextChanger } from '../common/changer';

const hasDotDotDotToken = (node: tslib.Node): node is tslib.BindingElement => {
  return (
    node.getChildAt(0) &&
    node.getChildAt(0).kind === tslib.SyntaxKind.DotDotDotToken
  );
};

export class RollIntoSpread extends Refactor {
  name = ERefactorKind.rollIntoSpread;
  description = '';
  actions = [
    {
      name: ERefactorKind.rollIntoSpread,
      description: 'Collapse into rest operator',
    },
  ];

  canBeApplied(
    _node: tslib.Node | undefined,
    fileName: string,
    positionOrRange: number | tslib.TextRange
  ) {
    const program = this.info.languageService.getProgram();
    const sourceFile = program && program.getSourceFile(fileName);

    if (!sourceFile || typeof positionOrRange === 'number') {
      return false;
    }

    const nodes = findAllNodesInRange(sourceFile, positionOrRange);
    return (
      nodes.length !== 0 &&
      nodes.every((n) => tslib.isBindingElement(n)) &&
      tslib.isObjectBindingPattern(nodes[0].parent)
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
    const program = this.info.languageService.getProgram();
    const sourceFile = program && program.getSourceFile(fileName);

    const printer = new Printer(this.info, formatOptions);
    const changer = new TextChanger(this.info, formatOptions);

    if (!sourceFile || typeof positionOrRange === 'number') {
      return;
    }

    const selectedNodes =
      sourceFile &&
      (findAllNodesInRange(
        sourceFile,
        positionOrRange
      ) as tslib.BindingElement[]);
    const parent = selectedNodes[0].parent as tslib.ObjectBindingPattern;
    const bindingElements: tslib.BindingElement[] = [];

    parent.forEachChild((node) => {
      bindingElements.push(node as tslib.BindingElement);
    });

    const spreadNode =
      bindingElements.find(hasDotDotDotToken) ||
      tslib.createBindingElement(
        tslib.createToken(tslib.SyntaxKind.DotDotDotToken),
        undefined,
        'rest'
      );

    const updatedNode = tslib.updateObjectBindingPattern(parent, [
      ...bindingElements.filter(
        (elm) => selectedNodes.indexOf(elm) === -1 && elm !== spreadNode
      ),
      spreadNode,
    ]);

    const newText = printer.fallbackPrint(updatedNode, fileName);

    if (!newText) {
      return;
    }

    return changer.createTextEdit(fileName, parent, ` ${newText}`);
  }
}
