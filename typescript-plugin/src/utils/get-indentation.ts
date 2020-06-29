
export const getLineIndentation = (line: string) => {
  let spacesCount = line.search(/\S/);

  if (spacesCount === -1) return 0;

  return spacesCount;
}