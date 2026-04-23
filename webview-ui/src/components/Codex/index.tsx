import { useTranslation } from '../../i18n';
import './Codex.css';

interface RegexEntry {
  meta: string;
  desc: string;
  example: string;
}

interface Section {
  titleKey: string;
  icon: string;
  entries: RegexEntry[];
}

const SECTIONS: Section[] = [
  {
    titleKey: 'codex.section.basic',
    icon: '◈',
    entries: [
      { meta: '.', desc: 'codex.dot', example: 'a.c → abc, a1c, a-c' },
      { meta: '\\d', desc: 'codex.digit', example: '\\d → 0, 1, …, 9' },
      { meta: '\\D', desc: 'codex.nonDigit', example: '\\D → a, !, _' },
      { meta: '\\w', desc: 'codex.word', example: '\\w → [a-zA-Z0-9_]' },
      { meta: '\\W', desc: 'codex.nonWord', example: '\\W → @, #, !' },
      { meta: '\\s', desc: 'codex.space', example: '\\s → space, tab, \\n' },
      { meta: '\\S', desc: 'codex.nonSpace', example: '\\S → a, 1, !' },
    ],
  },
  {
    titleKey: 'codex.section.anchors',
    icon: '⚓',
    entries: [
      { meta: '^', desc: 'codex.start', example: '^abc → "abc…"' },
      { meta: '$', desc: 'codex.end', example: 'xyz$ → "…xyz"' },
      { meta: '\\b', desc: 'codex.boundary', example: '\\bword\\b' },
      { meta: '\\B', desc: 'codex.nonBoundary', example: 'abc\\B → "abcdef"' },
    ],
  },
  {
    titleKey: 'codex.section.quantifiers',
    icon: '∞',
    entries: [
      { meta: '*', desc: 'codex.star', example: 'ab* → a, ab, abb' },
      { meta: '+', desc: 'codex.plus', example: 'ab+ → ab, abb' },
      { meta: '?', desc: 'codex.question', example: 'ab? → a, ab' },
      { meta: '{n}', desc: 'codex.exactN', example: 'a{3} → aaa' },
      { meta: '{n,}', desc: 'codex.atLeastN', example: 'a{2,} → aa, aaa' },
      { meta: '{n,m}', desc: 'codex.range', example: 'a{1,3} → a, aa, aaa' },
      { meta: '*? +? ??', desc: 'codex.lazy', example: 'a.*?b → shortest match' },
    ],
  },
  {
    titleKey: 'codex.section.charclass',
    icon: '▣',
    entries: [
      { meta: '[abc]', desc: 'codex.charSet', example: '[aeiou] → vowels' },
      { meta: '[^abc]', desc: 'codex.negCharSet', example: '[^0-9] → non-digits' },
      { meta: '[a-z]', desc: 'codex.charRange', example: '[A-Za-z] → letters' },
    ],
  },
  {
    titleKey: 'codex.section.groups',
    icon: '⟨⟩',
    entries: [
      { meta: '(…)', desc: 'codex.captureGroup', example: '(abc){2} → abcabc' },
      { meta: '(?:…)', desc: 'codex.nonCapture', example: '(?:ab|cd)+ → ababcd' },
      { meta: '(?<name>…)', desc: 'codex.namedGroup', example: '(?<year>\\d{4})' },
      { meta: '\\1  $1', desc: 'codex.backRef', example: '(\\w+)\\s\\1 → "the the"' },
      { meta: '\\k<name>', desc: 'codex.namedRef', example: '\\k<year>' },
    ],
  },
  {
    titleKey: 'codex.section.lookaround',
    icon: '◉',
    entries: [
      { meta: '(?=…)', desc: 'codex.posLookahead', example: '\\d(?=px) → "12px"→1,2' },
      { meta: '(?!…)', desc: 'codex.negLookahead', example: '\\d(?!px) → "12em"→1,2' },
      { meta: '(?<=…)', desc: 'codex.posLookbehind', example: '(?<=\\$)\\d+ → "$99"→99' },
      { meta: '(?<!…)', desc: 'codex.negLookbehind', example: '(?<!\\$)\\d+ → "€99"→99' },
    ],
  },
  {
    titleKey: 'codex.section.flags',
    icon: '⚑',
    entries: [
      { meta: 'i', desc: 'codex.flagI', example: '/abc/i → ABC, Abc' },
      { meta: 'g', desc: 'codex.flagG', example: '/a/g → all matches' },
      { meta: 'm', desc: 'codex.flagM', example: '/^line/m → each line' },
      { meta: 's', desc: 'codex.flagS', example: '/a.b/s → a\\nb' },
    ],
  },
  {
    titleKey: 'codex.section.advanced',
    icon: '⟁',
    entries: [
      { meta: '(?R)', desc: 'codex.recursion', example: '\\((?:[^()]+|(?R))*\\)' },
      { meta: '(?(1)…|…)', desc: 'codex.conditional', example: '(?(1)then|else)' },
      { meta: '\\K', desc: 'codex.resetMatch', example: 'foo\\Kbar → match "bar"' },
    ],
  },
];

export function Codex() {
  const { t } = useTranslation();

  return (
    <div className="codex">
      <header className="codex__header">
        <div className="codex__header-scanline" />
        <h1 className="codex__title">
          <span className="codex__title-icon">⟐</span>
          {t('codex.title')}
        </h1>
        <p className="codex__subtitle">{t('codex.subtitle')}</p>
      </header>

      <div className="codex__content">
        {SECTIONS.map((sec, si) => (
          <section key={si} className="codex__section">
            <div className="codex__section-header">
              <span className="codex__section-icon">{sec.icon}</span>
              <span className="codex__section-title">{t(sec.titleKey)}</span>
              <span className="codex__section-line" />
            </div>

            <div className="codex__table">
              <div className="codex__row codex__row--head">
                <span className="codex__col codex__col--meta">{t('codex.colPattern')}</span>
                <span className="codex__col codex__col--desc">{t('codex.colDesc')}</span>
                <span className="codex__col codex__col--example">{t('codex.colExample')}</span>
              </div>
              {sec.entries.map((entry, i) => (
                <div key={i} className="codex__row">
                  <span className="codex__col codex__col--meta"><code>{entry.meta}</code></span>
                  <span className="codex__col codex__col--desc">{t(entry.desc)}</span>
                  <span className="codex__col codex__col--example"><code>{entry.example}</code></span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="codex__footer">
        <span className="codex__footer-text">{t('codex.footer')}</span>
      </footer>
    </div>
  );
}
