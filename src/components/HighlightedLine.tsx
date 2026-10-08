import { Fragment } from 'react';

type Token = { text: string; kind?: 'keyword' | 'string' | 'comment' | 'number' };

/** Lightweight, dependency-free highlighting for snippets (not a language parser). */
function tokenize(line: string, path: string): Token[] {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!['php', 'inc', 'phtml', 'js', 'jsx', 'ts', 'tsx', 'sql', 'json', 'css', 'scss'].includes(extension ?? '')) return [{ text: line }];
  const keywords = extension === 'sql'
    ? /^(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|LIMIT|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|INDEX|AND|OR|NOT|NULL|AS|HAVING|DISTINCT)$/i
    : /^(?:function|class|interface|trait|enum|public|private|protected|static|return|if|else|elseif|foreach|for|while|try|catch|throw|new|const|let|var|async|await|import|export|default|extends|implements|namespace|use|fn|true|false|null)$/;
  const pattern = /(\/\/.*$|#.*$|--\s.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z_0-9]*\b)/g;
  const result: Token[] = []; let last = 0;
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) result.push({ text: line.slice(last, start) });
    const word = match[0];
    const kind = /^(?:\/\/|#|--\s|\/\*)/.test(word) ? 'comment'
      : /^["'`]/.test(word) ? 'string' : /^\d/.test(word) ? 'number' : keywords.test(word) ? 'keyword' : undefined;
    result.push({ text: word, kind }); last = start + word.length;
  }
  if (last < line.length) result.push({ text: line.slice(last) });
  return result;
}

export function HighlightedLine({ line, path }: { line: string; path: string }) {
  return <>{tokenize(line, path).map((token, i) => <Fragment key={i}>{token.kind ? <span className={`syntax-${token.kind}`}>{token.text}</span> : token.text}</Fragment>)}</>;
}
