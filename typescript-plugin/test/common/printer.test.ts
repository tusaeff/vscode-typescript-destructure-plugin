import { Printer } from '../../src/common/printer';
import { getPluginCreateInfo, TEST_FILENAME } from '../mock';
import * as tslib from 'typescript/lib/tsserverlibrary';

describe('Printer', () => {
  const printer = new Printer(getPluginCreateInfo(), {});

  describe('One-line ObjectBindingPattern', () => {
    it('Prints simple pattern', () => {
      const bindingName = 'property';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName,
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('{ property }');
    });

    it('Prints pattern with spread', () => {
      const bindingName = 'property';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          tslib.createToken(tslib.SyntaxKind.DotDotDotToken),
          undefined,
          bindingName,
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('{ ...property }');
    });

    it('Prints pattern with property alias', () => {
      const bindingName = 'property';
      const aliasName = 'alias';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          aliasName,
          bindingName,
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('{ property: alias }');
    });

    it('Prints pattern with property initializer', () => {
      const bindingName = 'property';
      const aliasName = 'alias';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName,
          tslib.createBinary(
            tslib.createNumericLiteral('2'),
            tslib.SyntaxKind.PlusToken,
            tslib.createNumericLiteral('4')
          )
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('{ property = 2 + 4 }');
    });

    it('Prints pattern with indentation', () => {
      const bindingName = 'property';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName,
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 4, indentStart: true },
        TEST_FILENAME
      );

      expect(printed).toBe('    { property }');
    });
  });

  describe('Multi-line ObjectBindingPattern', () => {
    it('Prints multi-line pattern when >2 properties', () => {
      const bindingName = 'property';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '1',
          undefined
        ),
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '2',
          undefined
        ),
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '3',
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe(`{
    property1,
    property2,
    property3
}`);
    });

    it('Prints multi-line pattern with indentation', () => {
      const bindingName = 'property';
      const tree = tslib.createObjectBindingPattern([
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '1',
          undefined
        ),
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '2',
          undefined
        ),
        tslib.createBindingElement(
          undefined,
          undefined,
          bindingName + '3',
          undefined
        ),
      ]);

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 4, indentStart: true },
        TEST_FILENAME
      );

      expect(printed).toBe(`    {
        property1,
        property2,
        property3
    }`);
    });
  });

  describe('Variable Statement', () => {
    it('Prints simple const correctly', () => {
      const tree = tslib.createVariableStatement(
        undefined,
        tslib.createVariableDeclarationList(
          [
            tslib.createVariableDeclaration(
              'variable',
              tslib.createLiteralTypeNode(tslib.createLiteral(true)),
              tslib.createBinary(
                tslib.createNumericLiteral('2'),
                tslib.createToken(tslib.SyntaxKind.EqualsEqualsEqualsToken),
                tslib.createNumericLiteral('2')
              )
            ),
          ],
          tslib.NodeFlags.Const
        )
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('const variable: true = 2 === 2;');
    });
    it('Prints simple let correctly', () => {
      const tree = tslib.createVariableStatement(
        undefined,
        tslib.createVariableDeclarationList(
          [
            tslib.createVariableDeclaration(
              'variable',
              tslib.createLiteralTypeNode(tslib.createLiteral(true)),
              tslib.createBinary(
                tslib.createNumericLiteral('2'),
                tslib.createToken(tslib.SyntaxKind.EqualsEqualsEqualsToken),
                tslib.createNumericLiteral('2')
              )
            ),
          ],
          tslib.NodeFlags.Let
        )
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('let variable: true = 2 === 2;');
    });
    it('Prints const declaration with one-line destructuring correctly', () => {
      const tree = tslib.createVariableStatement(
        undefined,
        tslib.createVariableDeclarationList(
          [
            tslib.createVariableDeclaration(
              tslib.createObjectBindingPattern([
                tslib.createBindingElement(
                  undefined,
                  undefined,
                  'property',
                  undefined
                ),
              ]),
              undefined,
              tslib.createIdentifier('variable')
            ),
          ],
          tslib.NodeFlags.Const
        )
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe('const { property } = variable;');
    });

    it('Prints const declaration with multi-line destructuring correctly', () => {
      const tree = tslib.createVariableStatement(
        undefined,
        tslib.createVariableDeclarationList(
          [
            tslib.createVariableDeclaration(
              tslib.createObjectBindingPattern([
                tslib.createBindingElement(
                  undefined,
                  undefined,
                  'property1',
                  undefined
                ),
                tslib.createBindingElement(
                  undefined,
                  undefined,
                  'property2',
                  undefined
                ),
                tslib.createBindingElement(
                  undefined,
                  undefined,
                  'property3',
                  undefined
                ),
              ]),
              undefined,
              tslib.createIdentifier('variable')
            ),
          ],
          tslib.NodeFlags.Const
        )
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe(`const { 
    property1,
    property2,
    property3
} = variable;`);
    });
  });

  describe('Arrow Function', () => {
    it('Prints simple arrow function', () => {
      const tree = tslib.createArrowFunction(
        undefined,
        undefined,
        [
          tslib.createParameter(
            undefined,
            undefined,
            undefined,
            'a',
            undefined,
            tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword)
          ),
        ],
        tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword),
        tslib.createToken(tslib.SyntaxKind.EqualsGreaterThanToken),
        tslib.createPostfixIncrement(tslib.createIdentifier('a'))
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe(`(a: number): number => a++`);
    });

    it('Prints arrow function with block body', () => {
      const tree = tslib.createArrowFunction(
        undefined,
        undefined,
        [
          tslib.createParameter(
            undefined,
            undefined,
            undefined,
            'a',
            undefined,
            tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword)
          ),
        ],
        tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword),
        tslib.createToken(tslib.SyntaxKind.EqualsGreaterThanToken),
        tslib.createBlock([
          tslib.createReturn(tslib.createPostfixIncrement(tslib.createIdentifier('a')))
        ])
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 0, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe(`(a: number): number => {
    return a++;
}`);
    });

    it('Prints arrow function with block body with indentation', () => {
      const tree = tslib.createArrowFunction(
        undefined,
        undefined,
        [
          tslib.createParameter(
            undefined,
            undefined,
            undefined,
            'a',
            undefined,
            tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword)
          ),
        ],
        tslib.createKeywordTypeNode(tslib.SyntaxKind.NumberKeyword),
        tslib.createToken(tslib.SyntaxKind.EqualsGreaterThanToken),
        tslib.createBlock([
          tslib.createReturn(tslib.createPostfixIncrement(tslib.createIdentifier('a')))
        ])
      );

      const printed = printer.printNodeWithIndentation(
        tree,
        { base: 4, indentStart: false },
        TEST_FILENAME
      );

      expect(printed).toBe(`    (a: number): number => {
        return a++;
    }`);
    });
  });

  // it('Prints arrow function', (done) => {
  //   done.fail();
  // })
});
