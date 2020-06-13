import * as tslib from 'typescript/lib/tsserverlibrary';

export const traverseParents = (
  node: tslib.Node,
  cb: (node: tslib.Node) => boolean | undefined
): tslib.Node => {
  if (cb(node)) {
    return node;
  }

  return traverseParents(node.parent, cb);
};

export function createTextEdit(
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

export function printNode(
  info: tslib.server.PluginCreateInfo,
  fileName: string,
  node: tslib.Node
) {
  const program = info.languageService.getProgram();
  const sourceFile = program && program.getSourceFile(fileName);

  if (!program || !sourceFile) {
    return;
  }

  const printer = tslib.createPrinter();

  return printer.printNode(tslib.EmitHint.Unspecified, node, sourceFile);
}

export function createObjectBindingPatternForType(type: tslib.Type) {
  const bindings = type
    .getProperties()
    .map((p) => tslib.createBindingElement(undefined, undefined, p.getName()));

  return tslib.createObjectBindingPattern(bindings);
}

export function getTypeDestructuring(type: tslib.Type) {
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

export function getNodeType(
  info: tslib.server.PluginCreateInfo,
  node: tslib.Node
) {
  const program = info.languageService.getProgram();

  if (!program) {
    return;
  }

  const typeChecker = program.getTypeChecker();
  return typeChecker.getTypeAtLocation(node);
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

/**normalize the parameter so we are sure is of type Range */
export function positionOrRangeToRange(
  positionOrRange: number | tslib.TextRange
): tslib.TextRange {
  return typeof positionOrRange === 'number'
    ? { pos: positionOrRange, end: positionOrRange }
    : positionOrRange;
}

/**normalize the parameter so we are sure is of type number */
export function positionOrRangeToNumber(
  positionOrRange: number | tslib.TextRange
): number {
  return typeof positionOrRange === 'number'
    ? positionOrRange
    : (positionOrRange as tslib.TextRange).pos;
}

/** from given position we find the child node that contains it */
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

const contextsKindsWithForbiddenDestructure = [
  tslib.SyntaxKind.PropertyAssignment,
  tslib.SyntaxKind.PropertyDeclaration,
];

export function isDestructurable(
  info: tslib.server.PluginCreateInfo,
  node?: tslib.Node
) {
  const isIdentifier = node && node.kind === tslib.SyntaxKind.Identifier;
  const type = isIdentifier && getNodeType(info, node!);
  const isObject = type && (type as tslib.ObjectType).objectFlags; // TODO: узнать какие именно objectFlags мне нужно поддерживать

  const isContextForbidden =
    !node ||
    contextsKindsWithForbiddenDestructure.indexOf(node.parent.kind) !== -1;

  return isIdentifier && isObject && !isContextForbidden;
}
