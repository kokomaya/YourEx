import { useState, useEffect } from 'react';
import { useVSCode } from '../../hooks/useVSCode';
import './Welcome.css';

const BOOT_LINES = [
  '>> 接入未知信号源…',
  '>> 协议识别失败…',
  '>> 语言结构：未知',
  '',
  '所有异常数据中，都出现同一个标记：',
];

const REX_REVEAL = '            r E x';

const STORY_LINES = [
  '它不是代码，也不是攻击。',
  '它是一种语言。',
  '',
  '你被选中参与这次解析任务。',
  '原因只有一个：你能够定义规则。',
];

export function Welcome() {
  const { postMessage } = useVSCode();
  const [visibleLines, setVisibleLines] = useState(0);
  const [showRex, setShowRex] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Typewriter effect for boot lines
    const totalLines = BOOT_LINES.length;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleLines(current);
      if (current >= totalLines) {
        clearInterval(interval);
        setTimeout(() => setShowRex(true), 400);
        setTimeout(() => setShowStory(true), 1200);
        setTimeout(() => setShowButtons(true), 2400);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    postMessage({ command: 'startDecryption' });
  };

  return (
    <div className="welcome">
      <h2 className="boot-title">[System Booting…]</h2>

      <div className="boot-lines">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <p key={i} className="boot-line">{line || '\u00A0'}</p>
        ))}
      </div>

      {showRex && (
        <div className="rex-reveal">
          <pre>{REX_REVEAL}</pre>
        </div>
      )}

      {showStory && (
        <div className="story-lines">
          {STORY_LINES.map((line, i) => (
            <p key={i} className="story-line">{line || '\u00A0'}</p>
          ))}
        </div>
      )}

      {showButtons && (
        <div className="welcome-actions">
          <button className="btn-primary" onClick={handleStart}>
            🤖 启用协助系统
          </button>
          <button className="btn-secondary" onClick={handleStart}>
            ⚔️ 独立解析
          </button>
        </div>
      )}
    </div>
  );
}
