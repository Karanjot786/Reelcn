// Props rows for an item's exported `<Name>Props` type, read straight from registry/items/<name>.tsx with the
// TypeScript compiler API (no runtime import of the item — that would need a browser, for its fonts and context).
import { readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

/** How the item page's Customize panel edits a prop; unset for types it can't edit (objects, arrays, callbacks, mixes). */
export type PropControl = "switch" | "slider" | "select" | "color" | "text";

export type PropRow = {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
  control?: PropControl;
  /** The choices for a `select` control: the union's string literals, aliases resolved. */
  options?: string[];
};

/** The control for a prop's type, with `undefined` already stripped: literal unions become selects. */
function controlFor(name: string, type: ts.Type): Pick<PropRow, "control" | "options"> {
  const parts = type.isUnion() ? type.types : [type];
  if (parts.every((part) => part.flags & ts.TypeFlags.BooleanLike)) return { control: "switch" };
  if (parts.every((part) => part.flags & ts.TypeFlags.NumberLike)) return { control: "slider" };
  if (parts.every((part) => part.isStringLiteral())) {
    return { control: "select", options: parts.map((part) => (part as ts.StringLiteralType).value) };
  }
  if (parts.length === 1 && type.flags & ts.TypeFlags.String) {
    if (name === "className") return {};
    return { control: /color$/i.test(name) ? "color" : "text" };
  }
  return {};
}

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
// One `ts.Program` per source directory, built once each so every item page in that directory
// (registry/items or registry/tools) shares one type-check.
const cached = new Map<string, Compiled>();

function compile(dir: string): Compiled {
  const hit = cached.get(dir);
  if (hit) return hit;
  const files = readdirSync(dir)
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => path.join(dir, file));
  const program = ts.createProgram(files, COMPILER_OPTIONS);
  const compiled = { program, checker: program.getTypeChecker() };
  cached.set(dir, compiled);
  return compiled;
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
    const defined = checker.getNonNullableType(propType);
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
      ...controlFor(symbol.getName(), defined),
    };
  });
}
