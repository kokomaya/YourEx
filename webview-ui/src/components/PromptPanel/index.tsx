import { useState, useCallback, useEffect } from 'react';
import { useVSCode, useMessageListener } from '../../hooks/useVSCode';
import type { Level, JudgeResult, PromptScore, ExtensionMessage } from '../../types/messages';
import './PromptPanel.css';

export function PromptPanel() {
  const { postMessage } = useVSCode();
  const [level, setLevel] = useState<Level | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    judgeResult: JudgeResult;
    score?: PromptScore;
    feedback: string;
    rawRegex?: string;
  } | null>(null);

  useMessageListener(useCallback((msg: unknown) => {
    const data = msg as ExtensionMessage;
    switch (data.command) {
      case 'loadLevel':
        setLevel(data.level);
        setResult(null);
        setPrompt('');
        break;
      case 'showResult':
        setResult({
          judgeResult: data.result,
          score: data.score,
          feedback: data.feedback,
          rawRegex: data.rawRegex,
        });
        setLoading(false);
        break;
      case 'showError':
        setResult({
          judgeResult: { status: 'error', matched: [], expected: [], rawRegexString: '', errorMessage: data.message },
          feedback: data.message,
        });
        setLoading(false);
        break;
      case 'setLoading':
        setLoading(data.loading);
        break;
    }
  }, []));

  useEffect(() => {
    postMessage({ command: 'ready' });
  }, [postMessage]);

  const handleExecute = () => {
    if (!level || !prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    postMessage({ command: 'executePrompt', prompt: prompt.trim(), levelId: level.id });
  };

  const handleManual = () => {
    if (!level) return;
    postMessage({ command: 'manualMode', levelId: level.id });
  };

  if (!level) {
    return (
      <div className="prompt-panel">
        <h2>[Signal Decryption Terminal]</h2>
        <p className="text-secondary">&gt; Awaiting signal data…</p>
        <p className="text-muted hint">选择侧边栏中的关卡以开始解密</p>
      </div>
    );
  }

  const statusIcon = result ? getStatusIcon(result.judgeResult.status) : null;

  return (
    <div className="prompt-panel">
      <header className="signal-header">
        <h2>[Signal #{level.id.replace('level_', '')} — {level.title}]</h2>
        <span className="difficulty-badge" data-difficulty={level.difficulty}>
          {level.difficulty}
        </span>
      </header>

      <section className="signal-story">
        <p className="text-secondary">{level.story}</p>
      </section>

      <section className="signal-challenge">
        <h3>📋 任务</h3>
        <p>{level.promptChallenge}</p>
      </section>

      <section className="test-data">
        <h3>📡 测试数据</h3>
        <ul className="data-list">
          {level.input.map((item, i) => (
            <li key={i} className={getMatchClass(item, result)}>
              <span className="data-marker">✦</span> "{item}"
              {result && (
                <span className="match-indicator">
                  {result.judgeResult.matched.includes(item) ? ' ✓' : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="expected-label">
          <span className="text-muted">Expected: </span>
          {level.expected.map((e, i) => (
            <code key={i} className="expected-item">"{e}"</code>
          ))}
        </div>
      </section>

      <section className="prompt-input">
        <h3>✍️ 你的指令</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="向解码协助系统下达指令……"
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExecute();
          }}
        />
        <div className="char-count text-muted">{prompt.length} 字符</div>
      </section>

      <div className="action-buttons">
        <button className="btn-primary" onClick={handleExecute} disabled={loading || !prompt.trim()}>
          {loading ? '🔄 解析中…' : '🤖 Execute Parse'}
        </button>
        <button className="btn-secondary" onClick={handleManual} disabled={loading}>
          ⚔️ Manual
        </button>
      </div>

      {result && (
        <section className="result-panel" data-status={result.judgeResult.status}>
          <h3>{statusIcon} {getStatusLabel(result.judgeResult.status)}</h3>
          <p className="feedback-text">{result.feedback}</p>

          {result.rawRegex && (
            <div className="regex-display">
              <span className="text-muted">🤖 生成规则：</span>
              <code>{result.rawRegex}</code>
            </div>
          )}

          <div className="match-stats">
            <span>Signal: {result.judgeResult.matched.length}/{level.expected.length}</span>
            {result.score && <span> | Prompt 评分: {result.score.total}</span>}
          </div>

          {result.score && result.score.total > 0 && (
            <div className="score-breakdown">
              <div className="score-row">
                <span>📏 简洁度</span>
                <div className="score-bar"><div style={{ width: `${result.score.brevityScore}%` }} /></div>
                <span>{result.score.brevityScore}</span>
              </div>
              <div className="score-row">
                <span>🎯 一次性</span>
                <div className="score-bar"><div style={{ width: `${result.score.firstTryScore}%` }} /></div>
                <span>{result.score.firstTryScore}</span>
              </div>
              <div className="score-row">
                <span>🧠 优雅度</span>
                <div className="score-bar"><div style={{ width: `${result.score.eleganceScore}%` }} /></div>
                <span>{result.score.eleganceScore}</span>
              </div>
              <div className="score-row">
                <span>⚔️ 规则质量</span>
                <div className="score-bar"><div style={{ width: `${result.score.regexQualityScore}%` }} /></div>
                <span>{result.score.regexQualityScore}</span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'perfect': return '✅✅';
    case 'pass': return '✅';
    case 'partial': return '⚠️';
    case 'error': return '🚫';
    default: return '❌';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'perfect': return '[Full Decode]';
    case 'pass': return '[Decoded]';
    case 'partial': return '[Partial Match]';
    case 'error': return '[System Error]';
    default: return '[Parse Failed]';
  }
}

function getMatchClass(item: string, result: { judgeResult: JudgeResult } | null): string {
  if (!result) return '';
  const isMatched = result.judgeResult.matched.includes(item);
  const isExpected = result.judgeResult.expected.includes(item);
  if (isMatched && isExpected) return 'match-correct';
  if (isMatched && !isExpected) return 'match-extra';
  if (!isMatched && isExpected) return 'match-missed';
  return '';
}
