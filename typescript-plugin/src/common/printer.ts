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
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ): string {
    switch (node.kind) {
      case tslib.SyntaxKind.ObjectBindingPattern:
        return this.printObjectBindingPattern(
          node as tslib.ObjectBindingPattern,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.BindingElement:
        return this.printBindingElement(
          node as tslib.BindingElement,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.ArrowFunction:
        return this.printArrowFunction(
          node as tslib.ArrowFunction,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.VariableStatement:
        return this.printVariableStatement(
          node as tslib.VariableStatement,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.VariableDeclarationList:
        return this.printVariableDeclarationList(
          node as tslib.VariableDeclarationList,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.VariableDeclaration:
        return this.printVariableDeclaration(
          node as tslib.VariableDeclaration,
          fileName,
          indentation
        );

      case tslib.SyntaxKind.Block:
        return this.printBlock(node as tslib.Block, fileName, indentation);

      default:
        return this.fallbackPrint(node, fileName, indentation);
    }
  }

  public printNodeWithoutIndentation(node: tslib.Node, fileName: string) {
    return this.printNodeWithIndentation(node, fileName);
  }

  protected printVariableDeclaration(
    node: tslib.VariableDeclaration,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    const { name, exclamationToken, type, initializer } = node;

    return [
      this.printNodeWithIndentation(name, fileName, indentation),
      exclamationToken && '!',
      type && `: ${this.printNodeWithIndentation(type, fileName, indentation)}`,
      initializer &&
        ` = ${this.printNodeWithIndentation(
          initializer,
          fileName,
          indentation
        )}`,
    ]
      .filter(Boolean)
      .join('');
  }

  protected printVariableDeclarationList(
    node: tslib.VariableDeclarationList,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    let keyword;

    if (node.flags & tslib.NodeFlags.Const) {
      keyword = 'const';
    }

    if (node.flags & tslib.NodeFlags.Let) {
      keyword = 'let';
    }

    if (!keyword) {
      keyword = 'var';
    }

    const printedDeclarations = node.declarations
      .map((d) =>
        this.printNodeWithIndentation(d, fileName, {
          indentStart: false,
          base: indentation.base,
        })
      )
      .join(', ');

    return [
      indentation.indentStart
        ? this.getIndentationAsString(indentation.base)
        : '',
      keyword,
      ' ',
      printedDeclarations,
      ';',
    ].join('');
  }

  protected printVariableStatement(
    node: tslib.VariableStatement,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    return this.printNodeWithIndentation(
      node.declarationList,
      fileName,
      indentation
    );
  }

  protected printBlock(
    node: tslib.Block,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    const printedStatements = node.statements.map((s) =>
      this.printNodeWithIndentation(s, fileName, {
        indentStart: true,
        base: this.incrementIndentation(indentation.base),
      })
    );

    return [
      `{`,
      printedStatements.join('\n'),
      `${this.getIndentationAsString(indentation.base)}}`,
    ].join('\n');
  }

  protected printArrowFunction(
    node: tslib.ArrowFunction,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
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
      indentation.indentStart
        ? this.getIndentationAsString(indentation.base)
        : '',
      typeParameters && `<${generics?.join(', ')}>`,
      args && `(${args.join(', ')})`,
      type && `: ${printedType}`,
      ' ',
      equalsGreaterThanToken && '=>',
      ' ',
      this.printNodeWithIndentation(body, fileName, {
        indentStart: false,
        base: indentation.base,
      }),
    ].join('');
  }

  protected printBindingElement(
    node: tslib.BindingElement,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    const { dotDotDotToken, propertyName, name, initializer } = node;

    const printedName = this.printNodeWithIndentation(name, fileName, {
      base: indentation.base,
      indentStart: false,
    });

    const printedPropertyName =
      propertyName &&
      this.printNodeWithIndentation(propertyName, fileName, {
        base: indentation.base,
        indentStart: false,
      });

    const printedInitializer =
      initializer &&
      this.printNodeWithIndentation(initializer, fileName, {
        indentStart: false,
        base: indentation.base,
      });

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
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
    const { elements } = node;
    const shouldAddNewLine = elements.length > 1;

    const printedElements = node.elements.map((bindingElement) =>
      this.printNodeWithIndentation(bindingElement, fileName, {
        base: this.incrementIndentation(indentation.base),
        indentStart: shouldAddNewLine,
      })
    );

    const joiner = shouldAddNewLine ? '\n' : ' ';

    return [
      `${
        indentation.indentStart
          ? this.getIndentationAsString(indentation.base)
          : ''
      }{`,
      printedElements.join(`,${joiner}`),
      `${
        shouldAddNewLine ? this.getIndentationAsString(indentation.base) : ''
      }}`,
    ].join(joiner);
  }

  public getIndentationAsString(indentation: number) {
    return ' '.repeat(indentation);
  }

  protected incrementIndentation(indentation: number) {
    const indentSize =
      this.formatOptions.indentSize || this.DEFAULT_INDENT_SIZE;

    return indentation + indentSize;
  }

  public fallbackPrint(
    node: tslib.Node,
    fileName: string,
    indentation: IIndentationOptions = { base: 0, indentStart: false }
  ) {
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
        printedNode = `${this.getIndentationAsString(
          indentation.base
        )}${printedNode}`;
      }

      return printedNode;
    }

    console.error(
      `Can't get sourceFile: ${fileName}, ${sourceFile}, ${program}`
    );

    return '';
  }
}
