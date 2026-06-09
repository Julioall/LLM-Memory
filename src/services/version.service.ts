export function createLineDiff(previous: string, current: string): string {
  const previousLines = previous.split("\n");
  const currentLines = current.split("\n");
  const maxLines = Math.max(previousLines.length, currentLines.length);
  const output: string[] = [];

  for (let index = 0; index < maxLines; index += 1) {
    const oldLine = previousLines[index];
    const newLine = currentLines[index];

    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        output.push(`  ${oldLine}`);
      }
      continue;
    }

    if (oldLine !== undefined) {
      output.push(`- ${oldLine}`);
    }

    if (newLine !== undefined) {
      output.push(`+ ${newLine}`);
    }
  }

  return output.join("\n");
}

