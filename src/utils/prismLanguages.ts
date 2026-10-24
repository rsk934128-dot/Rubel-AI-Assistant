import Prism from 'prismjs';

// Attach Prism to global environment immediately
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

// Resilient placeholder stub to prevent any third-party hooks or edge cases from crashing
if (!Prism.languages['markup-templating']) {
  Prism.languages['markup-templating'] = {
    buildPlaceholders: () => {},
    tokenizePlaceholders: () => {},
  } as any;
}

// Base languages
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

// Core Web & App languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';

// Systems & Backend languages
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-regex';

// Custom clean PHP definition without buggy HTML-templating hooks
if (Prism.languages.clike) {
  Prism.languages.php = Prism.languages.extend('clike', {
    keyword: /\b(?:__halt_compiler|abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|never|new|or|parent|print|private|protected|public|readonly|require|require_once|return|self|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
    boolean: {
      pattern: /\b(?:false|true)\b/i,
    },
    constant: [
      /\b[A-Z_][A-Z0-9_]*\b/,
      /\b(?:null)\b/i,
    ],
    variable: /\$[a-zA-Z_]\w*/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: /\b0b[01]+(?:_[01]+)*\b|\b0x[0-9a-f]+(?:_[0-9a-f]+)*\b|(?:\b\d+(?:_\d+)*\.?\d*(?:_\d+)*|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+)?/i,
    operator: /<?=>|<<=?|>>=?|===|!==|[-+*\/%^&|*!<>]=?|&&|\|\||::|\?->|\?|\.{3}/,
    punctuation: /[{}\[\](),;]/,
  });
}

// Map common aliases to Prism language identifiers
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  py3: 'python',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  markup: 'markup',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  json: 'json',
  jsonc: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  sql: 'sql',
  pgsql: 'sql',
  postgres: 'sql',
  mysql: 'sql',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  csharp: 'csharp',
  java: 'java',
  kt: 'kotlin',
  kotlin: 'kotlin',
  go: 'go',
  golang: 'go',
  rs: 'rust',
  rust: 'rust',
  php: 'php',
  docker: 'docker',
  dockerfile: 'docker',
  graphql: 'graphql',
  gql: 'graphql',
};

/**
 * Normalizes a language name to standard format
 */
export function normalizeLanguage(lang: string = ''): string {
  const clean = lang.trim().toLowerCase();
  return LANGUAGE_MAP[clean] || clean || 'plaintext';
}

/**
 * Returns extension for file download
 */
export function getExtensionForLanguage(lang: string = ''): string {
  const norm = normalizeLanguage(lang);
  const extMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    bash: 'sh',
    markup: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    markdown: 'md',
    sql: 'sql',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    java: 'java',
    kotlin: 'kt',
    go: 'go',
    rust: 'rs',
    php: 'php',
    docker: 'dockerfile',
    graphql: 'graphql',
  };
  return extMap[norm] || norm || 'txt';
}

/**
 * Highlights a string of code using Prism.js with resilient fallback
 */
export function highlightCode(code: string, language: string = ''): string {
  if (!code) return '';

  try {
    const normLang = normalizeLanguage(language);
    const grammar = Prism.languages[normLang];

    if (grammar) {
      return Prism.highlight(code, grammar, normLang);
    }
  } catch (err) {
    console.warn(`Prism highlighting fallback for ${language}:`, err);
  }

  // Fallback to basic HTML-escaping
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default Prism;
