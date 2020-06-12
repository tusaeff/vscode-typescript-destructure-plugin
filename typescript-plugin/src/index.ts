import * as ts_module from 'typescript/lib/tsserverlibrary'

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript

  function create(info: ts_module.server.PluginCreateInfo) {
    const whatToRemove: string[] = info.config.remove || ['caller']
    info.project.projectService.logger.info('I\'m getting set up now! Check the log for this message.')
    const proxy: ts.LanguageService = Object.create(null)
    for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k]

      // @ts-ignore
      proxy[k] = (...args: Array<{}>) => x!.apply(info.languageService, args)
    }

    proxy.getCompletionsAtPosition = (fileName, position) => {
      const prior = info.languageService.getCompletionsAtPosition(fileName, position, undefined)!
      const oldLength = prior.entries.length
      prior.entries = prior.entries.filter(e => whatToRemove.indexOf(e.name) < 0)

      if (oldLength !== prior.entries.length) {
        info.project.projectService.logger.info(`Removed ${oldLength - prior.entries.length} entries from the completion list`)
      }

      return prior
    }


    proxy.getApplicableRefactors = (fileName, positionOrRange): ts_module.ApplicableRefactorInfo[] => {
      const refactors = info.languageService.getApplicableRefactors(fileName, positionOrRange, undefined) || []
      let sourceFile = null;
      try {
        sourceFile = info.languageService.getProgram()!.getSourceFile(fileName)
      } catch (error) {
        return refactors
      }

      if (!sourceFile) {
        return refactors
      }

      const refactorInfo = {
        name: 'useless-rename-info',
        description: 'useless rename desc',
        actions: [{ name: 'useless-rename', description: 'Destructure object' }],
      }

      const nodeAtCursor = findChildContainingPosition(sourceFile, positionOrRangeToNumber(positionOrRange))

      if (nodeAtCursor &&
        nodeAtCursor.kind === ts.SyntaxKind.Identifier
        ) {
          refactors.push(refactorInfo)
        }
        return refactors
      }

      proxy.getEditsForRefactor = (fileName, formatOptions, positionOrRange, refactorName, actionName, preferences) => {
        const refactors = info.languageService.getEditsForRefactor(fileName, formatOptions, positionOrRange, refactorName, actionName, preferences)

        
        if (actionName !== 'useless-rename') {

          return refactors 

        }


        const sourceFile = info.languageService.getProgram()!.getSourceFile(fileName)
        const typeChecker = info.languageService.getProgram()!.getTypeChecker();
        if (!sourceFile) {
          return refactors
        }
        const nodeAtCursor = findChildContainingPosition(sourceFile, positionOrRangeToNumber(positionOrRange))
        const type = typeChecker.getTypeAtLocation(nodeAtCursor!);

        if ((nodeAtCursor !== undefined && nodeAtCursor.kind === ts.SyntaxKind.Identifier && type.flags === 524288)) {
          const properties = type.getProperties();

          let destructStatement

          if (properties.length > 1) {
            destructStatement = properties.reduce((acc, p) => acc += `\n    ${p.getName()},`, '');
            destructStatement += `\n`;
          } else if (properties.length === 1) {
            destructStatement = ' ' + properties[0].getName() + ' ';
          } else {
            destructStatement = ''
          }

          destructStatement = `{${destructStatement}  }`;

          const renameTo = `const ${destructStatement} = ${nodeAtCursor.getText()}`
          const range = positionOrRangeToRange(positionOrRange)
          return {
            edits: [{
              fileName,
              textChanges: [{ 
                span: { start: range.pos, length: range.end - range.pos }, // the segment of code that will be replaced
                newText: renameTo 
              }],
            }],
            renameFilename: undefined,
            renameLocation: undefined,
          }
        }
        else {
          return refactors
        }
      }
      return proxy
    }

    
    /**normalize the parameter so we are sure is of type Range */
  function positionOrRangeToRange(positionOrRange: number | ts_module.TextRange): ts_module.TextRange {
    return typeof positionOrRange === 'number'
      ? { pos: positionOrRange, end: positionOrRange }
      : positionOrRange
  }

  /**normalize the parameter so we are sure is of type number */
  function positionOrRangeToNumber(positionOrRange: number | ts_module.TextRange): number {
    return typeof positionOrRange === 'number' ?
      positionOrRange :
      (positionOrRange as ts_module.TextRange).pos
  }

  /** from given position we find the child node that contains it */
  function findChildContainingPosition(sourceFile: ts.SourceFile, position: number): ts.Node | undefined {
    function find(node: ts.Node): ts.Node | undefined {
      if (position >= node.getStart() && position < node.getEnd()) {
        return ts.forEachChild(node, find) || node
      }
    }
    return find(sourceFile)
  }

  return { create }
}

export = init