export interface ExtractedRegex {
  regex: RegExp;
  raw: string;
  flags: string;
}

/**
 * Extract regex from AI response text.
 * Covers formats: code blocks, inline backticks, /pattern/flags, new RegExp()
 */
export function extractRegex(aiResponse: string): RegExp | null {
  const result = extractRegexWithMeta(aiResponse);
  return result?.regex ?? null;
}

export function extractRegexWithMeta(aiResponse: string): ExtractedRegex | null {
  const strategies = [
    extractFromCodeBlock,
    extractFromInlineBackticks,
    extractFromNewRegExp,
    extractFromSlashNotation,
  ];

  for (const strategy of strategies) {
    const result = strategy(aiResponse);
    if (result) {
      return result;
    }
  }
  return null;
}

// ```regex\n/pattern/flags\n```  or  ```\n/pattern/flags\n```
function extractFromCodeBlock(text: string): ExtractedRegex | null {
  const match = text.match(/```(?:regex|js|javascript)?\s*\n?\s*(\/.*?\/[gimsuy]*)\s*\n?\s*```/s);
  if (match) {
    return parseSlashRegex(match[1]);
  }
  return null;
}

// `/pattern/flags`
function extractFromInlineBackticks(text: string): ExtractedRegex | null {
  const match = text.match(/`(\/.*?\/[gimsuy]*)`/);
  if (match) {
    return parseSlashRegex(match[1]);
  }
  return null;
}

// new RegExp("pattern", "flags")
function extractFromNewRegExp(text: string): ExtractedRegex | null {
  const match = text.match(/new\s+RegExp\(\s*["'](.+?)["'](?:\s*,\s*["']([gimsuy]*)["'])?\s*\)/);
  if (match) {
    return buildRegex(match[1], match[2] ?? '');
  }
  return null;
}

// /pattern/flags anywhere in text (greedy last resort)
function extractFromSlashNotation(text: string): ExtractedRegex | null {
  const match = text.match(/(\/(?:[^/\\]|\\.)+\/[gimsuy]*)/);
  if (match) {
    return parseSlashRegex(match[1]);
  }
  return null;
}

function parseSlashRegex(raw: string): ExtractedRegex | null {
  const match = raw.match(/^\/(.+)\/([gimsuy]*)$/s);
  if (!match) {
    return null;
  }
  return buildRegex(match[1], match[2]);
}

function buildRegex(pattern: string, flags: string): ExtractedRegex | null {
  try {
    const regex = new RegExp(pattern, flags);
    return { regex, raw: `/${pattern}/${flags}`, flags };
  } catch {
    return null;
  }
}
