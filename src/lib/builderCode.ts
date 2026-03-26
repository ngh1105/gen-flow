export function resolveBuilderCode(
  generatedCode: string,
  customCode: string
): string {
  return customCode || generatedCode;
}
