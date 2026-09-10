const examples = [
  '今年不能回家，想对爸妈说一句，不要太煽情。',
  '给很久没联系的朋友写一句中秋问候。',
  '我只记得妈妈做的桂花糖藕，帮我写成一句话。'
];

const wish = document.querySelector('#wish');
const counter = document.querySelector('#counter');
const submitButton = document.querySelector('#submitButton');
const exampleButton = document.querySelector('#exampleButton');
const inputArea = document.querySelector('#inputArea');
const resultControls = document.querySelector('#resultControls');
const backButton = document.querySelector('#backButton');
const eyebrow = document.querySelector('#eyebrow');
const headline = document.querySelector('#headline');
const intro = document.querySelector('#intro');
const gathering = document.querySelector('#gathering');
const cardCopy = document.querySelector('#cardCopy');
const cardTitle = document.querySelector('#cardTitle');
const cardBody = document.querySelector('#cardBody');
const shareText = document.querySelector('#shareText');
const saveButton = document.querySelector('#saveButton');
const copyButton = document.querySelector('#copyButton');
const steps = document.querySelector('#steps');
let currentTone = '';
let appliedTone = '';
let currentResult = null;
let baseResult = null;
let requestController = null;

function showResult(result) {
  currentResult = result;
  cardTitle.textContent = currentResult.title;
  cardBody.textContent = currentResult.body;
  shareText.textContent = currentResult.share;
  cardCopy.classList.add('result-copy');
}

async function requestModel(tone = '') {
  const apiBase = String(window.MID_AUTUMN_CONFIG?.apiUrl || '').replace(/\/$/, '');
  if (!apiBase) throw new Error('尚未配置模型接口');
  if (requestController) requestController.abort();
  requestController = new AbortController();
  const timeout = setTimeout(() => requestController.abort(), 22000);
  try {
    const response = await fetch(`${apiBase}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 三种调整始终以第一次生成的准确版本为底稿，避免连续点击后语义逐步漂移。
      body: JSON.stringify({ message: wish.value.trim(), tone, previous: tone ? baseResult : null }),
      signal: requestController.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.card) throw new Error(data.error || '模型接口暂时不可用');
    return data.card;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithFallback(tone = '') {
  try {
    const result = await requestModel(tone);
    if (!tone) baseResult = { ...result };
    showResult(result);
    return 'model';
  } catch (error) {
    // 调整失败时不能用通用模板覆盖已经准确的初稿。
    if (tone && currentResult) {
      console.warn('[midautumn] 调整未完成，保留当前文案：', error.message);
      return 'preserved';
    }
    console.warn('[midautumn] 首次生成使用本地备用文案：', error.message);
    showResult(window.MidAutumnCopy.generate(wish.value, tone));
    if (!tone) baseResult = { ...currentResult };
    return 'fallback';
  }
}

wish.addEventListener('input', () => {
  counter.textContent = `${wish.value.length}/180`;
  submitButton.disabled = !wish.value.trim();
});

exampleButton.addEventListener('click', () => {
  wish.value = examples[Math.floor(Math.random() * examples.length)];
  wish.dispatchEvent(new Event('input'));
  wish.focus();
});

submitButton.addEventListener('click', async () => {
  if (!wish.value.trim()) return;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner"></span> 正在整理心意…';
  gathering.classList.remove('hidden');
  cardCopy.classList.add('hidden');
  currentTone = '';
  appliedTone = '';
  currentResult = null;
  baseResult = null;
  await generateWithFallback();
  gathering.classList.add('hidden');
  cardCopy.classList.remove('hidden');
  inputArea.classList.add('hidden');
  eyebrow.classList.add('hidden');
  resultControls.classList.remove('hidden');
  backButton.classList.remove('hidden');
  saveButton.classList.remove('hidden');
  headline.textContent = '你的心意，已经写好了。';
  intro.textContent = '保留你的真实细节，只把表达整理得更自然。';
  steps.children[1].classList.add('active');
  steps.querySelector('em').textContent = '心意卡';
  steps.setAttribute('aria-label', '当前步骤 2，共 2 步');
});

backButton.addEventListener('click', () => {
  inputArea.classList.remove('hidden');
  eyebrow.classList.remove('hidden');
  resultControls.classList.add('hidden');
  backButton.classList.add('hidden');
  saveButton.classList.add('hidden');
  headline.innerHTML = '月亮升起时，<br>每一份想念都有了方向。';
  intro.textContent = '写下你想对谁说、发生了什么，一句话就够。';
  submitButton.innerHTML = 'AI 帮我表达 <span aria-hidden="true">›</span>';
  submitButton.disabled = !wish.value.trim();
  cardTitle.innerHTML = '把没说出口的心意，<br>说得刚刚好。';
  cardBody.textContent = '你的真实片段，会在这里变成一张克制、自然的中秋心意卡。';
  cardCopy.classList.remove('result-copy');
  steps.children[1].classList.remove('active');
  steps.querySelector('em').textContent = '写一句';
  steps.setAttribute('aria-label', '当前步骤 1，共 2 步');
});

document.querySelector('#toneRow').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  currentTone = button.dataset.tone;
  const buttons = document.querySelectorAll('#toneRow button');
  buttons.forEach((item) => {
    item.classList.toggle('active', item === button);
    item.disabled = true;
  });
  const oldText = button.textContent;
  button.textContent = '正在调整…';
  const resultSource = await generateWithFallback(currentTone);
  if (resultSource === 'preserved') {
    currentTone = appliedTone;
    buttons.forEach((item) => item.classList.toggle('active', item.dataset.tone === appliedTone));
  } else {
    appliedTone = currentTone;
  }
  button.textContent = resultSource === 'preserved' ? '调整失败，请重试' : oldText;
  if (resultSource === 'preserved') {
    setTimeout(() => { button.textContent = oldText; }, 1800);
  }
  buttons.forEach((item) => { item.disabled = false; });
});

copyButton.addEventListener('click', async () => {
  const text = `${currentResult.title}\n\n${currentResult.body}\n\n${currentResult.share}`;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.lastElementChild.textContent = '已复制';
    setTimeout(() => { copyButton.lastElementChild.textContent = '复制全部文字'; }, 1800);
  } catch {
    window.prompt('请复制以下文字', text);
  }
});

function wrapCanvasText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const char of Array.from(text)) {
    if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  return lines;
}

saveButton.addEventListener('click', async () => {
  if (!currentResult) return;
  const image = new Image();
  image.src = './midautumn-ui-poster.jpg';
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 2340;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(image, 0, 0, 1080, 2340);

  const panelX = 54;
  const panelY = 1510;
  const panelWidth = 972;
  const panelHeight = 775;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 22);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(173, 119, 29, 0.72)';
  ctx.stroke();

  ctx.fillStyle = '#b51f24';
  ctx.font = '700 30px "PingFang SC", sans-serif';
  ctx.fillText('中秋限定 · 思念 SKILL', 122, 1605);

  ctx.fillStyle = '#352819';
  ctx.font = '500 80px "Songti SC", "STSong", serif';
  const titleLines = wrapCanvasText(ctx, currentResult.title, 836).slice(0, 2);
  let cursorY = 1710;
  titleLines.forEach((line) => {
    ctx.fillText(line, 122, cursorY);
    cursorY += 96;
  });

  ctx.fillStyle = '#665746';
  ctx.font = '400 36px "PingFang SC", sans-serif';
  cursorY += 15;
  wrapCanvasText(ctx, currentResult.body, 836).slice(0, 4).forEach((line) => {
    ctx.fillText(line, 122, cursorY);
    cursorY += 58;
  });

  ctx.fillStyle = 'rgba(157, 107, 30, 0.35)';
  ctx.fillRect(122, 2180, 836, 2);
  ctx.fillStyle = '#9e6c19';
  ctx.font = '400 27px "PingFang SC", sans-serif';
  ctx.fillText('工银瑞信 AI时间合伙人', 122, 2240);
  const link = document.createElement('a'); link.download = '我的中秋心意卡.png'; link.href = canvas.toDataURL('image/png'); link.click();
});
