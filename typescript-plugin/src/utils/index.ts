import * as ts_module from 'typescript/lib/tsserverlibrary';

export function createTextEdit(
  fileName: string,
  positionOrRange: number | ts_module.TextRange,
  newText: string
) {
  const range = positionOrRangeToRange(positionOrRange);

  return {
    edits: [
      {
        fileName,
        textChanges: [
          {
            span: { start: range.pos, length: range.end - range.pos }, // the segment of code that will be replaced
            newText,
          },
        ],
      },
    ],
    renameFilename: undefined,
    renameLocation: undefined,
  };
}

export function getTypeDestructuring(type: ts_module.Type) {
  if (type.flags !== ts_module.TypeFlags.Object) {
    return;
  }

  const properties = type.getProperties();

  let destructStatement;

  if (properties.length > 1) {
    destructStatement = properties.reduce(
      (acc, p, index) =>
        (acc += `\n    ${p.getName()}${
          index !== properties.length - 1 ? ',' : ''
        }`),
      ''
    );
    destructStatement += `\n`;
  } else if (properties.length === 1) {
    destructStatement = ' ' + properties[0].getName() + ' ';
  } else {
    destructStatement = '';
  }

  return `${destructStatement}`;
}

export function getNodeType(info: ts_module.server.PluginCreateInfo, node: ts_module.Node) {
  const program = info.languageService.getProgram();

  if (!program) {
    return;
  }

  const typeChecker = program.getTypeChecker();
  return typeChecker.getTypeAtLocation(node);
}

export function getNodeByLocation(
  info: ts_module.server.PluginCreateInfo,
  fileName: string,
  positionOrRange: number | ts_module.TextRange
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

/**normalize the parameter so we are sure is of type Range */
export function positionOrRangeToRange(
  positionOrRange: number | ts_module.TextRange
): ts_module.TextRange {
  return typeof positionOrRange === 'number'
    ? { pos: positionOrRange, end: positionOrRange }
    : positionOrRange;
}

/**normalize the parameter so we are sure is of type number */
export function positionOrRangeToNumber(
  positionOrRange: number | ts_module.TextRange
): number {
  return typeof positionOrRange === 'number'
    ? positionOrRange
    : (positionOrRange as ts_module.TextRange).pos;
}

/** from given position we find the child node that contains it */
export function findChildContainingPosition(
  sourceFile: ts_module.SourceFile,
  position: number
): ts_module.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return ts_module.forEachChild(node, find) || node;
    }
  }
  return find(sourceFile);
}

export function findAllNodesInRange(
  sourceFile: ts_module.SourceFile,
  position: ts_module.TextRange
): ts_module.Node[] {
  function find(node: ts.Node, acc: ts.Node[] = []): ts.Node[] | undefined {
    const isNodeInRange =
      position.pos <= node.getStart() && position.end >= node.getEnd();
    const isNodeIncludesRange =
      node.getStart() <= position.pos && node.getEnd() >= position.end;

    if (isNodeInRange) {
      acc.push(node);
    } else if (isNodeIncludesRange) {
      ts_module.forEachChild(node, (node) => find(node, acc));
    }

    return undefined;
  }

  let acc: ts_module.Node[] = [];

  find(sourceFile, acc);

  return acc;
}
