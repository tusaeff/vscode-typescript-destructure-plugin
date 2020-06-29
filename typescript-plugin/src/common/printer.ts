import * as tslib from 'typescript/lib/tsserverlibrary';

export interface IIndentationOptions {
  indentStart: boolean;
  base: number;
}

export class Printer {
  public DEFAULT_INDENT_SIZE = 4;

  constructor(
    protected info: tslib.server.PluginCreateInfo,
    protected formatOptions: tslib.FormatCodeSettings
  ) {}

  protected fallbackPrinter = tslib.createPrinter();

  public printNodeWithIndentation(
    node: tslib.Node,
    indentation: IIndentationOptions,
    fileName: string
  ): string {
    switch (node.kind) {
      case tslib.SyntaxKind.ObjectBindingPattern:
        return this.printObjectBindingPattern(
          node as tslib.ObjectBindingPattern,
          indentation,
          fileName
        );

      case tslib.SyntaxKind.BindingElement:
        return this.printBindingElement(
          node as tslib.BindingElement,
          indentation,
          fileName
        );

      case tslib.SyntaxKind.ArrowFunction:
        return this.printArrowFunction(
          node as tslib.ArrowFunction,
          indentation,
          fileName
        );

      case tslib.SyntaxKind.Block:
        return this.printBlock(node as tslib.Block, indentation, fileName);

      default:
        return this.fallbackPrint(node, indentation, fileName);
    }
  }

  public printNodeWithoutIndentation(node: tslib.Node, fileName: string) {
    return this.printNodeWithIndentation(node, { base: 0, indentStart: false }, fileName);
  }

  protected printBlock(
    node: tslib.Block,
    indentation: IIndentationOptions,
    fileName: string
  ) {
    const printedStatements = node.statements.map((s) =>
      this.printNodeWithIndentation(
        s,
        { indentStart: true, base: this.incrementIndentation(indentation.base) },
        fileName
      )
    );

    return [
      `{`,
      printedStatements.join('\n'),
      `${this.getIndentationAsString(indentation.base)}}`,
    ].join('\n');
  }

  protected printArrowFunction(
    node: tslib.ArrowFunction,
    indentation: IIndentationOptions,
    fileName: string
  ) {
    const {
      typeParameters,
      parameters,
      equalsGreaterThanToken,
      body,
      type,
    } = node;

    const generics =
      typeParameters &&
      typeParameters.map((p) => this.printNodeWithoutIndentation(p, fileName));
    const args =
      parameters &&
      parameters.map((p) => this.printNodeWithoutIndentation(p, fileName));
    const printedType =
      type && this.printNodeWithoutIndentation(type, fileName);

    return [
      indentation.indentStart ? this.getIndentationAsString(indentation.base) : '',
      typeParameters && `<${generics?.join(', ')}>`,
      args && `(${args.join(', ')})`,
      type && `: ${printedType}`,
      ' ',
      equalsGreaterThanToken && '=>',
      ' ',
      this.printNodeWithIndentation(
        body,
        { indentStart: false, base: indentation.base },
        fileName
      ),
    ].join('');
  }

  protected printBindingElement(
    node: tslib.BindingElement,
    indentation: IIndentationOptions,
    fileName: string
  ) {
    const { dotDotDotToken, propertyName, name, initializer } = node;

    const printedName = this.printNodeWithIndentation(
      name,
      { base: indentation.base, indentStart: false },
      fileName
    );

    const printedPropertyName =
      propertyName &&
      this.printNodeWithIndentation(
        propertyName,
        { base: indentation.base, indentStart: false },
        fileName
      );

    const printedInitializer =
      initializer &&
      this.printNodeWithIndentation(
        initializer,
        {
          indentStart: false,
          base: indentation.base,
        },
        fileName
      );

    return [
      indentation.indentStart && this.getIndentationAsString(indentation.base),
      dotDotDotToken && '...',
      printedName,
      propertyName && `: ${printedPropertyName}`,
      initializer && ` = ${printedInitializer}`,
    ]
      .filter(Boolean)
      .join('');
  }

  protected printObjectBindingPattern(
    node: tslib.ObjectBindingPattern,
    indentation: IIndentationOptions,
    fileName: string
  ) {
    const { elements } = node;
    const shouldAddNewLine = elements.length > 1;

    const printedElements = node.elements.map((bindingElement) =>
      this.printNodeWithIndentation(
        bindingElement,
        {
          base: this.incrementIndentation(indentation.base),
          indentStart: shouldAddNewLine,
        },
        fileName
      )
    );

    const joiner = shouldAddNewLine ? '\n' : ' ';

    return [
      `${indentation.indentStart ? this.getIndentationAsString(indentation.base) : ''}{`,
      printedElements.join(`,${joiner}`),
      `${
        shouldAddNewLine ? this.getIndentationAsString(indentation.base) : ''
      }}`,
    ].join(joiner);
  }

  protected getIndentationAsString(indentation: number) {
    return ' '.repeat(indentation);
  }

  protected incrementIndentation(indentation: number) {
    const indentSize =
      this.formatOptions.indentSize || this.DEFAULT_INDENT_SIZE;

    return indentation + indentSize;
  }

  public fallbackPrint(node: tslib.Node, indentation: IIndentationOptions, fileName: string) {
    // console.warn(
    //   `Can't print an unknown node: ${node.kind}. Falling back to default tslib printer`
    // );

    const program = this.info.languageService.getProgram();
    const sourceFile = program?.getSourceFile(fileName);

    if (program && sourceFile) {
      let printedNode = this.fallbackPrinter.printNode(
        tslib.EmitHint.Unspecified,
        node,
        sourceFile
      );

      if (indentation.indentStart) {
        printedNode = `${this.getIndentationAsString(indentation.base)}${printedNode}`;
      }

      return printedNode;
    }

    console.error(
      `Can't get sourceFile: ${fileName}, ${sourceFile}, ${program}`
    );

    return '';
  }
}
