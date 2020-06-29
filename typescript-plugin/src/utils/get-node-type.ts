import * as tslib from 'typescript/lib/tsserverlibrary';

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