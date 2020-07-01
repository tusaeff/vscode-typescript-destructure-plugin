import * as tslib from 'typescript/lib/tsserverlibrary';
import { positionOrRangeToNumber } from './normalize-position-or-range';

export function findAllNodesInRange(
  sourceFile: tslib.SourceFile,
  position: tslib.TextRange
): tslib.Node[] {
  function find(node: ts.Node, acc: ts.Node[] = []): ts.Node[] | undefined {
    const isNodeInRange =
      position.pos <= node.getStart() && position.end >= node.getEnd();
    const isNodeIncludesRange =
      node.getStart() <= position.pos && node.getEnd() >= position.end;

    if (isNodeInRange) {
      acc.push(node);
    } else if (isNodeIncludesRange) {
      tslib.forEachChild(node, (node) => find(node, acc));
    }

    return undefined;
  }

  let acc: tslib.Node[] = [];

  find(sourceFile, acc);

  return acc;
}

export function findChildContainingPosition(
  sourceFile: tslib.SourceFile,
  position: number
): tslib.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return tslib.forEachChild(node, find) || node;
    }
  }
  return find(sourceFile);
}

export function getNodeByLocation(
  info: tslib.server.PluginCreateInfo,
  fileName: string,
  positionOrRange: number | tslib.TextRange
) {
  const program = info.languageService.getProgram();

  if (!program) {
    return;
  }

  const sourceFile = program.getSourceFile(fileName);

  if (!sourceFile) {
    return;
  }

  const node = findChildContainingPosition(
    sourceFile,
    positionOrRangeToNumber(positionOrRange)
  );

  return node;
}
