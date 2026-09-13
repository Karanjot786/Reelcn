// Props rows for an item's exported `<Name>Props` type, read straight from registry/items/<name>.tsx with the
// TypeScript compiler API (no runtime import of the item — that would need a browser, for its fonts and context).
import { readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export type PropRow = { name: string; type: string; required: boolean; default?: string; description: string };

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
};

type Compiled = { program: ts.Program; checker: ts.TypeChecker };
let cached: Compiled | undefined;

/** One `ts.Program` over every item file in `dir`, built once so 81 item pages share one type-check.
 * ponytail: cached once, not per directory — every caller passes a file in registry/items. */
function compile(dir: string): Compiled {
  if (cached) return cached;
  const files = readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => path.join(dir, file));
  const program = ts.createProgram(files, COMPILER_OPTIONS);
  cached = { program, checker: program.getTypeChecker() };
  return cached;
}

/** `{ prop = default }` on the file's top-level function declaration's first (destructured) parameter. */
function readDefaults(sourceFile: ts.SourceFile): Map<string, string> {
  const defaults = new Map<string, string>();
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isFunctionDeclaration(node) || node.parameters.length === 0) return;
    const param = node.parameters[0];
    if (!ts.isObjectBindingPattern(param.name)) return;
    for (const element of param.name.elements) {
      if (!ts.isBindingElement(element) || !element.initializer) continue;
      const key = element.propertyName ?? element.name;
      if (ts.isIdentifier(key)) defaults.set(key.text, element.initializer.getText(sourceFile));
    }
  });
  return defaults;
}

/** Rows for an item's `<Name>Props` type: name, type, required, default and its JSDoc description. */
export function propsTable(itemPath: string): PropRow[] {
  const { program, checker } = compile(path.dirname(itemPath));
  const sourceFile = program.getSourceFile(itemPath);
  if (!sourceFile) throw new Error(`propsTable: no source file for "${itemPath}"`);

  let alias: ts.TypeAliasDeclaration | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (!alias && ts.isTypeAliasDeclaration(node) && /Props$/.test(node.name.text)) alias = node;
  });
  if (!alias) return [];

  const defaults = readDefaults(sourceFile);
  const aliasType = checker.getTypeAtLocation(alias.name);

  return checker.getPropertiesOfType(aliasType).map((symbol) => {
    const propType = checker.getTypeOfSymbolAtLocation(symbol, alias!.name);
    // `?: T` types as `T | undefined`; the required column already carries that, so the string doesn't need it.
    const typeStr = checker
      .typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
      .replace(/ \| undefined/g, "");
    return {
      name: symbol.getName(),
      type: typeStr,
      required: !(symbol.flags & ts.SymbolFlags.Optional),
      default: defaults.get(symbol.getName()),
      description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
    };
  });
}
