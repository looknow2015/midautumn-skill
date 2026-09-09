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
let currentResult = null;

function cleanInput(value) {
  return value.replace(/[“”"]|帮我|写成一句话|写一句|说一句|中秋问候|中秋祝福|。$/g, '').trim();
}

function generateCopy(input, tone = '') {
  const normalized = input.trim();
  const isParents = /爸妈|父母|爸爸|妈妈/.test(normalized);
  const isFriend = /朋友|同学|很久没联系/.test(normalized);
  const isClient = /客户|合作|同事|领导/.test(normalized);
  const hasLotus = /桂花糖藕|糖藕/.test(normalized);
  const cannotReturn = /不能回家|回不去|不回家/.test(normalized);
  let result;

  if (hasLotus) result = { title: '还是记得那口甜', body: '中秋一到，就会想起你做的桂花糖藕。很多细节已经记不清了，唯独那一点甜，还稳稳地留在记忆里。', share: '有些想念不用说满，一口熟悉的甜就够了。' };
  else if (isParents && cannotReturn) result = { title: '月亮替我先回家', body: '今年中秋不能回家，想说的话也不用说得太满。你们好好吃饭，早点休息，等忙完这一阵，我再回去陪你们。', share: '不能一起过节，也没有忘记那盏家里的灯。' };
  else if (isFriend) result = { title: '好久不见，也很想念', body: '我们有一阵子没联系了，但偶尔想起以前的事，还是会觉得很近。借这个中秋问候你一句：最近过得好吗？', share: '有些朋友不常联系，想起时仍然觉得亲近。' };
  else if (isClient) result = { title: '一路同行，心意常在', body: '感谢一路以来的信任与同行。值此中秋，愿您与家人共度一段从容温暖的时光，所盼皆有回响。', share: '月满中秋，感谢同行。祝您和家人节日安康。' };
  else {
    const detail = cleanInput(normalized).slice(0, 42) || '这个中秋，我有一句话想对你说';
    result = { title: '想说的话，留在月下', body: `${detail}。不必把心意说得很满，记得彼此、惦念彼此，就是这个中秋最踏实的团圆。`, share: '把没说出口的心意，借今晚的月亮轻轻说完。' };
  }

  if (tone === '更短一点') return { title: result.title.slice(0, 10), body: result.body.split(/[。！]/).filter(Boolean)[0] + '。', share: result.share.slice(0, 24) };
  if (tone === '别太煽情') return { title: hasLotus ? '还记得那口甜' : isFriend ? '近来还好吗' : isClient ? '感谢同行' : '中秋，记得问候', body: result.body.replace(/想念|惦念/g, '记得').replace(/稳稳地|轻轻/g, ''), share: isClient ? '感谢同行，祝您中秋安康。' : '中秋到了，问候一句：近来都好吗？' };
  if (tone === '更像我说话') return { title: isParents ? '中秋快乐，等我回家' : isFriend ? '嗨，好久不见' : isClient ? '中秋安康' : '有句话想跟你说', body: isParents ? '今年中秋我回不去，你们照顾好自己，好好吃饭。等我忙完这阵就回家，到时候再慢慢聊。' : isFriend ? '好久没联系了，刚好中秋，想起你就来问候一句。最近怎么样？有空我们再好好聊聊。' : result.body, share: isParents ? '今年不能回家，但一直记挂着家里。' : result.share };
  return result;
}

function renderResult() {
  currentResult = generateCopy(wish.value, currentTone);
  cardTitle.textContent = currentResult.title;
  cardBody.textContent = currentResult.body;
  shareText.textContent = currentResult.share;
  cardCopy.classList.add('result-copy');
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

submitButton.addEventListener('click', () => {
  if (!wish.value.trim()) return;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner"></span> 正在整理心意…';
  gathering.classList.remove('hidden');
  cardCopy.classList.add('hidden');
  setTimeout(() => {
    currentTone = '';
    renderResult();
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
  }, 900);
});

backButton.addEventListener('click', () => {
  inputArea.classList.remove('hidden');
  eyebrow.classList.remove('hidden');
  resultControls.classList.add('hidden');
  backButton.classList.add('hidden');
  saveButton.classList.add('hidden');
  headline.innerHTML = '这个中秋，<br>有什么话不太容易说出口？';
  intro.textContent = '写下对象、情境或一个记得的细节，一句话就够。';
  submitButton.innerHTML = 'AI 帮我表达 <span aria-hidden="true">›</span>';
  submitButton.disabled = !wish.value.trim();
  cardTitle.innerHTML = '把没说出口的心意，<br>说得刚刚好。';
  cardBody.textContent = '你的真实片段，会在这里变成一张克制、自然的中秋心意卡。';
  cardCopy.classList.remove('result-copy');
  steps.children[1].classList.remove('active');
  steps.querySelector('em').textContent = '写一句';
  steps.setAttribute('aria-label', '当前步骤 1，共 2 步');
});

document.querySelector('#toneRow').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  currentTone = button.dataset.tone;
  document.querySelectorAll('#toneRow button').forEach((item) => item.classList.toggle('active', item === button));
  renderResult();
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
  image.src = './midautumn-paper-moon.png';
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(image, 0, 0, 1080, 1920);
  ctx.fillStyle = 'rgba(9,9,8,.18)'; ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = '#d8b67a'; ctx.font = '500 26px system-ui'; ctx.fillText('中秋表达 SKILL · 2026', 82, 98);
  ctx.fillStyle = '#fffaf0'; ctx.font = '600 68px serif';
  const titleLines = wrapCanvasText(ctx, currentResult.title, 690);
  titleLines.forEach((line, index) => ctx.fillText(line, 82, 660 + index * 88));
  const bodyY = 660 + titleLines.length * 88 + 54;
  ctx.font = '400 32px system-ui'; ctx.fillStyle = 'rgba(255,250,240,.86)';
  wrapCanvasText(ctx, currentResult.body, 760).forEach((line, index) => ctx.fillText(line, 82, bodyY + index * 55));
  ctx.fillStyle = '#c6523d'; ctx.fillRect(82, 1260, 42, 4);
  ctx.fillStyle = 'rgba(255,250,240,.65)'; ctx.font = '400 24px system-ui'; ctx.fillText('工银瑞信 AI时间合伙人｜中秋限定', 82, 1320);
  const link = document.createElement('a'); link.download = '我的中秋心意卡.png'; link.href = canvas.toDataURL('image/png'); link.click();
});
