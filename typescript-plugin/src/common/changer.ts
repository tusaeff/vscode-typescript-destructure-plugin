import * as tslib from 'typescript/lib/tsserverlibrary';
import { positionOrRangeToRange } from '../utils';
import { Printer } from './printer';

export class TextChanger {
  constructor(
    protected info: tslib.server.PluginCreateInfo,
    protected formatOptions: tslib.FormatCodeSettings
  ) {}

  protected printer = new Printer(this.info, this.formatOptions);

  replaceNode(
    nodeToReplace: tslib.Node,
    nodeToInsert: tslib.Node,
    fileName: string,
    options: {
      incrementPos?: boolean;
    } = {}
  ) {
    const indentation = this.getNodeIndentation(nodeToReplace, fileName);
    const { pos, end } = nodeToReplace;

    const printedNode = this.printer.printNodeWithIndentation(
      nodeToInsert,
      { indentStart: false, base: indentation },
      fileName
    );

    return this.createTextEdit(
      fileName,
      { pos: options.incrementPos ? pos + 1 : pos, end },
      printedNode
    );
  }

  replaceStatement(
    nodeToReplace: tslib.Statement,
    nodeToInsert: tslib.Node,
    fileName: string,
    options: {
      incrementPos?: boolean;
    } = {}
  ) {
    const indentation = this.getNodeIndentation(nodeToReplace, fileName);
    const { pos, end } = nodeToReplace;

    const printedNode = this.printer.printNodeWithIndentation(
      nodeToInsert,
      { indentStart: true, base: indentation },
      fileName
    );

    return this.createTextEdit(
      fileName,
      { pos: options.incrementPos ? pos + 1 : pos, end },
      printedNode
    );
  }

  // TODO: handle case with no anchorNode providen
  insertNodeAfter(
    anchorNode: tslib.Node,
    nodeToInsert: tslib.Node,
    fileName: string,
    options: {
      incrementPos?: boolean;
    } = {}
  ) {
    const indentation = this.getNodeIndentation(anchorNode, fileName);
    const { pos, end } = anchorNode;

    const printedNode = this.printer.printNodeWithIndentation(
      nodeToInsert,
      { indentStart: true, base: indentation },
      fileName
    );

    return this.createTextEdit(fileName, { pos: end, end }, '\n' + printedNode);
  }

  // TODO: handle case with no anchorNode providen
  insertNodeBefore(
    anchorNode: tslib.Node,
    nodeToInsert: tslib.Node,
    fileName: string,
    options: {
      incrementPos?: boolean;
    } = {}
  ) {
    const indentation = this.getNodeIndentation(anchorNode, fileName);
    const { pos, end } = anchorNode;

    const printedNode = this.printer.printNodeWithIndentation(
      nodeToInsert,
      { indentStart: true, base: indentation },
      fileName
    );

    return this.createTextEdit(fileName, { pos: pos, end: pos }, '\n' + printedNode);
  }

  public getNodeIndentation(node: tslib.Node, fileName: string) {
    const { languageService } = this.info;
    const { end } = node;

    return languageService.getIndentationAtPosition(
      fileName,
      end,
      this.formatOptions
    );
  }

  public createTextEdit(
    fileName: string,
    positionOrRange: number | tslib.TextRange,
    newText: string
  ) {
    const range = positionOrRangeToRange(positionOrRange);

    return {
      edits: [
        {
          fileName,
          textChanges: [
            {
              span: { start: range.pos, length: range.end - range.pos },
              newText,
            },
          ],
        },
      ],
      renameFilename: undefined,
      renameLocation: undefined,
    };
  }
}
