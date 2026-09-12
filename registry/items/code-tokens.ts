/**
 * @title Code Tokens
 * @category lib
 * @description Tiny dependency-free syntax tokenizer for ts, js, tsx, py, bash and json. Powers code-block and terminal.
 * @tags code, syntax, highlight, tokenizer
 * @example
 * const lines = tokenize("const answer = 42; // done", "ts");
 * // lines[0] → [{ text: "const", kind: "keyword" }, { text: " answer ", kind: "plain" }, { text: "=", kind: "punctuation" }, …]
 */

export type CodeLanguage = "ts" | "js" | "tsx" | "py" | "bash" | "json";

export type TokenKind = "keyword" | "string" | "number" | "comment" | "function" | "punctuation" | "plain";

export type Token = { text: string; kind: TokenKind };

type Grammar = {
  keywords: Set<string>;
  /** Starts a comment that runs to the end of the line. */
  lineComment?: string;
  /** `/* … *\/` comments, which may span lines. */
  blockComment?: boolean;
  /** String openers, longest first. Each string closes with its own opener. */
  quotes: string[];
  /** Openers whose strings may continue on the next line. */
  multiline: string[];
  /** Openers whose strings ignore backslash escapes. */
  raw?: string[];
  /** Variables such as `$HOME` or `${name}`. */
  variable?: RegExp;
  word: RegExp;
};

const words = (list: string) => new Set(list.split(" "));

const JS =
  "async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield";
const TS = `${JS} abstract any as asserts boolean declare enum implements infer interface is keyof namespace never number object private protected public readonly satisfies string symbol type unknown`;

const cLike = (keywords: string): Grammar => ({
  keywords: words(keywords),
  lineComment: "//",
  blockComment: true,
  quotes: ['"', "'", "`"],
  multiline: ["`"],
  word: /^[A-Za-z_$][\w$]*/,
});

const grammars: Record<CodeLanguage, Grammar> = {
  js: cLike(JS),
  ts: cLike(TS),
  tsx: cLike(TS),
  py: {
    keywords: words(
      "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return self try while with yield",
    ),
    lineComment: "#",
    quotes: ['"""', "'''", '"', "'"],
    multiline: ['"""', "'''"],
    word: /^[A-Za-z_]\w*/,
  },
  bash: {
    keywords: words("case do done elif else esac export fi for function if in local return select then until while"),
    lineComment: "#",
    quotes: ['"', "'"],
    multiline: ['"', "'"],
    raw: ["'"],
    variable: /^\$(?:\{[^}]*\}|[A-Za-z_]\w*|[\d#?@*$!-])/,
    word: /^[^\s|&;<>()"'`$\\]+/,
  },
  json: { keywords: words("false null true"), quotes: ['"'], multiline: [], word: /^[A-Za-z_]\w*/ },
};

/** Bash keywords after which the next word is a command again (`if grep …`, `then echo …`). */
const BASH_CONTROL = words("do elif else if then until while");

const NUMBER = /^(?:0[xX][\da-fA-F_]+|0[bBoO][\d_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)(?![\w$])/;
const WHITESPACE = /^\s+/;
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;

/** Default color per token kind, derived from theme colors. Pass `useTheme().colors`. */
export function tokenColors(colors: {
  foreground: string;
  muted: string;
  accent: string;
  highlight: string;
}): Record<TokenKind, string> {
  const mix = (a: string, b: string, percent: number) => `color-mix(in srgb, ${a} ${percent}%, ${b})`;
  return {
    keyword: colors.accent,
    function: mix(colors.accent, colors.foreground, 55),
    string: mix(colors.highlight, colors.foreground, 55),
    number: mix(mix(colors.highlight, colors.accent, 50), colors.foreground, 80),
    comment: colors.muted,
    punctuation: mix(colors.muted, colors.foreground, 70),
    plain: colors.foreground,
  };
}

/** Index just past `close`, searching from `from`, or -1 when the line ends first. */
function findClose(line: string, from: number, close: string, escapes: boolean): number {
  for (let i = from; i < line.length; i++) {
    if (escapes && line[i] === "\\") {
      i++;
      continue;
    }
    if (line.startsWith(close, i)) return i + close.length;
  }
  return -1;
}

/**
 * Split code into lines of colored tokens. Joining a line's token texts gives back that line exactly, so callers can
 * slice tokens to type code out character by character.
 */
export function tokenize(code: string, language: CodeLanguage): Token[][] {
  const g = grammars[language];
  // A string or block comment still open at the end of the previous line.
  let open: { close: string; kind: TokenKind; escapes: boolean } | null = null;

  return code.split("\n").map((line) => {
    const tokens: Token[] = [];
    const push = (text: string, kind: TokenKind) => {
      if (!text) return;
      const last = tokens[tokens.length - 1];
      if (last && last.kind === kind) last.text += text;
      else tokens.push({ text, kind });
    };

    let i = 0;
    if (open) {
      const end = findClose(line, 0, open.close, open.escapes);
      push(end < 0 ? line : line.slice(0, end), open.kind);
      if (end < 0) return tokens;
      i = end;
      open = null;
    }

    // Bash only: the next word names a command.
    let command = true;
    while (i < line.length) {
      const rest = line.slice(i);

      const space = WHITESPACE.exec(rest);
      if (space) {
        push(space[0], "plain");
        i += space[0].length;
        continue;
      }

      // Bash treats `#` as a comment only at the start of a word (`$#` and `a#b` are not comments).
      const commentAllowed = language !== "bash" || i === 0 || /\s/.test(line[i - 1]);
      if (g.lineComment && commentAllowed && rest.startsWith(g.lineComment)) {
        push(rest, "comment");
        break;
      }

      if (g.blockComment && rest.startsWith("/*")) {
        const end = findClose(line, i + 2, "*/", false);
        if (end < 0) {
          push(rest, "comment");
          open = { close: "*/", kind: "comment", escapes: false };
          break;
        }
        push(line.slice(i, end), "comment");
        i = end;
        continue;
      }

      const quote = g.quotes.find((opener) => rest.startsWith(opener));
      if (quote) {
        const escapes = !g.raw || g.raw.indexOf(quote) < 0;
        const end = findClose(line, i + quote.length, quote, escapes);
        if (end < 0) {
          push(rest, "string");
          if (g.multiline.indexOf(quote) >= 0) open = { close: quote, kind: "string", escapes };
          break;
        }
        push(line.slice(i, end), "string");
        i = end;
        command = false;
        continue;
      }

      const variable = g.variable?.exec(rest);
      if (variable) {
        push(variable[0], "keyword");
        i += variable[0].length;
        command = false;
        continue;
      }

      const number = NUMBER.exec(rest);
      if (number) {
        push(number[0], "number");
        i += number[0].length;
        command = false;
        continue;
      }

      const word = g.word.exec(rest);
      if (word) {
        const text = word[0];
        let kind: TokenKind = "plain";
        if (g.keywords.has(text)) kind = "keyword";
        else if (language === "bash" ? command : /^\s*\(/.test(line.slice(i + text.length))) kind = "function";
        else if (language === "tsx" && /<\/?$/.test(line.slice(0, i))) kind = "function";
        push(text, kind);
        i += text.length;
        command = language === "bash" && BASH_CONTROL.has(text);
        continue;
      }

      const char = line[i];
      push(char, ASCII_PUNCTUATION.test(char) ? "punctuation" : "plain");
      if (language === "bash") command = /[|;&(]/.test(char);
      i++;
    }
    return tokens;
  });
}
