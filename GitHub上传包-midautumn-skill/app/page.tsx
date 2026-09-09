'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Copy, Download, Moon, RefreshCw, Sparkles } from 'lucide-react';

type CardCopy = { title: string; body: string; share: string };

type ModelTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: ModelTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

const EXAMPLES = [
  '今年不能回家，想对爸妈说一句，不要太煽情。',
  '给很久没联系的朋友写一句中秋问候。',
  '我只记得妈妈做的桂花糖藕，帮我写成一句话。',
];
const TONES = ['更短一点', '别太煽情', '更像我说话'];

function cleanInput(value: string) {
  return value.replace(/[“”"]|帮我|写成一句话|写一句|说一句|中秋问候|中秋祝福|。$/g, '').trim();
}

function generateCopy(input: string, tone = ''): CardCopy {
  const normalized = input.trim();
  const isParents = /爸妈|父母|爸爸|妈妈/.test(normalized);
  const isFriend = /朋友|同学|很久没联系/.test(normalized);
  const isClient = /客户|合作|同事|领导/.test(normalized);
  const hasLotus = /桂花糖藕|糖藕/.test(normalized);
  const cannotReturn = /不能回家|回不去|不回家/.test(normalized);
  let result: CardCopy;

  if (hasLotus) {
    result = {
      title: '还是记得那口甜',
      body: '中秋一到，就会想起你做的桂花糖藕。很多细节已经记不清了，唯独那一点甜，还稳稳地留在记忆里。',
      share: '有些想念不用说满，一口熟悉的甜就够了。',
    };
  } else if (isParents && cannotReturn) {
    result = {
      title: '月亮替我先回家',
      body: '今年中秋不能回家，想说的话也不用说得太满。你们好好吃饭，早点休息，等忙完这一阵，我再回去陪你们。',
      share: '不能一起过节，也没有忘记那盏家里的灯。',
    };
  } else if (isFriend) {
    result = {
      title: '好久不见，也很想念',
      body: '我们有一阵子没联系了，但偶尔想起以前的事，还是会觉得很近。借这个中秋问候你一句：最近过得好吗？',
      share: '有些朋友不常联系，想起时仍然觉得亲近。',
    };
  } else if (isClient) {
    result = {
      title: '一路同行，心意常在',
      body: '感谢一路以来的信任与同行。值此中秋，愿您与家人共度一段从容温暖的时光，所盼皆有回响。',
      share: '月满中秋，感谢同行。祝您和家人节日安康。',
    };
  } else {
    const detail = cleanInput(normalized).slice(0, 42) || '这个中秋，我有一句话想对你说';
    result = {
      title: '想说的话，留在月下',
      body: `${detail}。不必把心意说得很满，记得彼此、惦念彼此，就是这个中秋最踏实的团圆。`,
      share: '把没说出口的心意，借今晚的月亮轻轻说完。',
    };
  }

  if (tone === '更短一点') return {
    title: result.title.slice(0, 10),
    body: result.body.split(/[。！]/).filter(Boolean)[0] + '。',
    share: result.share.slice(0, 24),
  };
  if (tone === '别太煽情') return {
    title: hasLotus ? '还记得那口甜' : isFriend ? '近来还好吗' : isClient ? '感谢同行' : '中秋，记得问候',
    body: result.body.replace(/想念|惦念/g, '记得').replace(/稳稳地|轻轻/g, ''),
    share: isClient ? '感谢同行，祝您中秋安康。' : '中秋到了，问候一句：近来都好吗？',
  };
  if (tone === '更像我说话') return {
    title: isParents ? '中秋快乐，等我回家' : isFriend ? '嗨，好久不见' : isClient ? '中秋安康' : '有句话想跟你说',
    body: isParents
      ? '今年中秋我回不去，你们照顾好自己，好好吃饭。等我忙完这阵就回家，到时候再慢慢聊。'
      : isFriend ? '好久没联系了，刚好中秋，想起你就来问候一句。最近怎么样？有空我们再好好聊聊。' : result.body,
    share: isParents ? '今年不能回家，但一直记挂着家里。' : result.share,
  };
  return result;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const char of Array.from(text)) {
    if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  return lines;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'input' | 'generating' | 'result'>('input');
  const [tone, setTone] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const result = useMemo(() => generateCopy(input, tone), [input, tone]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool: ModelTool = {
      name: 'create_midautumn_card',
      title: '生成中秋心意卡',
      description: '根据一段真实的中秋心意，在页面中生成可复制、可保存的心意卡。',
      inputSchema: {
        type: 'object',
        properties: { message: { type: 'string', minLength: 1, maxLength: 180, description: '对象、情境或一个真实细节' } },
        required: ['message'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(raw) {
        const message = typeof raw === 'object' && raw !== null && 'message' in raw ? String(raw.message).trim() : '';
        if (!message || message.length > 180) throw new Error('请提供 1 至 180 字的真实中秋心意。');
        const card = generateCopy(message);
        setInput(message); setTone(''); setStatus('result');
        return { status: 'created', card };
      },
    };
    try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); }
    catch { /* Unsupported experimental implementations should not affect the page. */ }
    return () => lifecycle.abort();
  }, []);

  function submit() {
    if (!input.trim()) return;
    setTone(''); setStatus('generating');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus('result'), 1250);
  }

  async function copyText() {
    await navigator.clipboard.writeText(`${result.title}\n\n${result.body}\n\n${result.share}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  async function downloadCard() {
    const image = new Image(); image.src = '/midautumn-paper-moon.png'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.drawImage(image, 0, 0, 1080, 1920);
    ctx.fillStyle = 'rgba(9, 9, 8, .18)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d8b67a'; ctx.font = '500 26px system-ui, sans-serif'; ctx.fillText('中秋表达 SKILL · 2026', 82, 98);
    ctx.fillStyle = '#fffaf0'; ctx.font = '600 68px serif';
    const titleLines = wrapCanvasText(ctx, result.title, 690);
    titleLines.forEach((line, index) => ctx.fillText(line, 82, 660 + index * 88));
    const bodyY = 660 + titleLines.length * 88 + 54;
    ctx.font = '400 32px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,250,240,.86)';
    wrapCanvasText(ctx, result.body, 760).forEach((line, index) => ctx.fillText(line, 82, bodyY + index * 55));
    ctx.fillStyle = '#c6523d'; ctx.fillRect(82, 1260, 42, 4);
    ctx.fillStyle = 'rgba(255,250,240,.65)'; ctx.font = '400 24px system-ui, sans-serif';
    ctx.fillText('工银瑞信 AI时间合伙人｜中秋限定', 82, 1320);
    const link = document.createElement('a'); link.download = '我的中秋心意卡.png'; link.href = canvas.toDataURL('image/png'); link.click();
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-mark" aria-label="工银瑞信 AI时间合伙人"><span className="brand-seal">工</span><span>工银瑞信 <i>AI时间合伙人</i></span></div>
        <div className="festival-label"><Moon size={14} /> 中秋限定</div>
      </header>

      <section className="experience">
        <div className="copy-panel">
          {status === 'result' ? <button className="back-button" onClick={() => setStatus('input')}><ArrowLeft size={17} /> 再写一句</button> : <div className="eyebrow">中秋表达 SKILL · 2026</div>}
          <div className="headline-block">
            <span className="chapter">01</span>
            <h1>{status === 'result' ? '你的心意，已经写好了。' : '这个中秋，\n有什么话不太容易说出口？'}</h1>
            <p>{status === 'result' ? '保留你的真实细节，只把表达整理得更自然。' : '写下对象、情境或一个记得的细节，一句话就够。'}</p>
          </div>

          {status !== 'result' && <div className="input-area">
            <label htmlFor="wish">我想说</label>
            <textarea id="wish" value={input} onChange={(event) => setInput(event.target.value)} placeholder="比如：今年不能回家，帮我给爸妈说一句，不要太煽情。" maxLength={180} disabled={status === 'generating'} />
            <div className="input-meta">
              <button onClick={() => setInput(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])} disabled={status === 'generating'}><RefreshCw size={14} /> 换个示例</button>
              <span>{input.length}/180</span>
            </div>
            <button className="primary-button" disabled={!input.trim() || status === 'generating'} onClick={submit}>
              {status === 'generating' ? <><span className="spinner" /> 正在整理心意…</> : <>AI 帮我表达 <ChevronRight size={18} /></>}
            </button>
            <p className="privacy-note">无需登录 · 不保存输入 · 约 30 秒完成</p>
          </div>}

          {status === 'result' && <div className="result-controls">
            <div><span className="control-label">再调整一下</span><div className="tone-row">{TONES.map((item) => <button key={item} className={tone === item ? 'active' : ''} onClick={() => setTone(item)}>{item}</button>)}</div></div>
            <div className="share-copy"><span className="control-label">分享配文</span><p>{result.share}</p><button onClick={copyText}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? '已复制' : '复制全部文字'}</button></div>
          </div>}
        </div>

        <div className="card-panel">
          <div className={`card-wrap ${status === 'generating' ? 'is-generating' : ''}`}>
            <div className="moon-card" aria-label="中秋心意卡预览">
              {/* oxlint-disable-next-line next/no-img-element */}
              <img src="/midautumn-paper-moon.png" alt="纸艺满月与桂花构成的中秋月影" />
              {status === 'generating' ? <div className="gathering-copy" aria-live="polite"><Sparkles size={25} /><span>正在理解对象、关系与语气</span><div className="gather-lines"><i /><i /><i /></div></div>
                : status === 'result' ? <div className="card-copy result-copy" aria-live="polite"><span className="card-kicker">中秋 · 一句心意</span><h2>{result.title}</h2><p>{result.body}</p><span className="card-signature">工银瑞信 AI时间合伙人｜中秋限定</span></div>
                : <div className="card-copy preview-copy"><span className="card-kicker">中秋 · 一句心意</span><h2>把没说出口的心意，<br />说得刚刚好。</h2><p>你的真实片段，会在这里变成一张克制、自然的中秋心意卡。</p><span className="card-signature">工银瑞信 AI时间合伙人｜中秋限定</span></div>}
            </div>
            {status === 'result' && <button className="save-button" onClick={downloadCard}><Download size={17} /> 保存心意卡</button>}
          </div>
          <div className="step-dots" aria-label={`当前步骤 ${status === 'result' ? 2 : 1}，共 2 步`}><span className="active" /><span className={status === 'result' ? 'active' : ''} /><em>{status === 'result' ? '心意卡' : '写一句'}</em></div>
        </div>
      </section>
    </main>
  );
}
