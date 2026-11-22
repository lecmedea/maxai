import catalog from './catalog.json' with { type: 'json' };
import { buildDemo } from './demo.js';

const PLATE = {
  image: 'assets/plate-a.jpg',
  video: 'assets/plate-c.jpg',
  audio: 'assets/plate-d.jpg',
  apps: 'assets/plate-b.jpg',
};
const STUDIO = {
  image: ['Картинка', 'Описание становится кадром'],
  video: ['Ролик', 'Кадр становится роликом'],
  audio: ['Звук', 'Сцена получает звук'],
  apps: ['Инструменты', 'Правка уже готового кадра'],
};
const CATEGORY = {
  create: 'Собрать', identity: 'Герой', camera: 'Камера', style: 'Вид', vfx: 'Эффекты',
  ads: 'Реклама', portraits: 'Портрет', clips: 'Ролики', play: 'Игра', templates: 'Шаблоны', more: 'Ещё',
};
const TAB = { create: 'Снять', edit: 'Поправить', motion: 'Движение', templates: 'Шаблоны' };
const FILM_KEY = 'maxai.film';
const NAME_KEY = 'maxai.name';
const FAV_KEY = 'maxai.fav';
const TEXT_IDS = new Set(['edit-text', 'meme', 'dub', 'music']);
const PAGES = new Set(['profile', 'favorites', 'text', 'trends', 'school', 'knowledge']);
const MENU = [
  ['profile', 'Профиль', 'Имя на этом устройстве'],
  ['favorites', 'Избранное', 'Отмеченные инструменты'],
  ['text', 'Текстовые ИИ', 'Слова, подписи и черновик'],
  ['studio/image', 'Генерация Изображений', 'Кадр по описанию'],
  ['studio/video', 'Генерация Видео', 'Ролик по кадру'],
  ['studio/audio', 'Генерация Аудио', 'Звук и музыка'],
  ['trends', 'Тренды', 'С чего начать в каталоге'],
  ['school', 'Школа ИИ', 'Короткие уроки'],
  ['knowledge', 'База знаний', 'Что делает каждый раздел'],
];
const ICONS = {
  profile: 'M6 2h4v3H6zM4 6h8v2H4zM5 9h6v5H5z',
  favorites: 'M8 1l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4z',
  text: 'M2 3h12v2H2zM2 7h12v2H2zM2 11h8v2H2z',
  image: 'M2 3h12v10H2zM4 11l2-3 2 2 2-2 2 3',
  video: 'M2 4h8v8H2zM11 6l3-2v8l-3-2z',
  audio: 'M3 8h2v5H3zM7 4h2v9H7zM11 6h2v7h-2z',
  trends: 'M2 12l4-4 2 2 5-6M10 4h4v4',
  school: 'M2 6l6-3 6 3-6 3zM4 8v3l4 2 4-2V8',
  knowledge: 'M2 2h5v12H2zM9 2h5v12H9z',
};
let sectionReturn = '#/';
const byId = new Map(catalog.apps.map((app) => [app.id, app]));
const root = document.querySelector('#app');
let query = '';
let job = 0;
let previews = [];
let backWired = false;
let startSeen = false;

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
function route() {
  const [head, id] = location.hash.replace(/^#\/?/, '').split('/');
  if (head === 'studio' && STUDIO[id]) return { name: 'studio', studio: id };
  if (head === 'app' && byId.has(id)) return { name: 'app', app: byId.get(id) };
  if (head === 'film') return { name: 'film' };
  if (PAGES.has(head)) return { name: head };
  return { name: 'home' };
}
function go(hash) { location.hash = hash; }
function openApp(id, back) { sectionReturn = back; go(`#/app/${id}`); }
function goUp() {
  const current = route();
  if (current.name === 'app') go(sectionReturn || `#/studio/${current.app.studio}`);
  else if (current.name !== 'home') go('#/');
}
function readList(key) {
  try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function pixelIcon(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', 'pixel');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[kind] || ICONS.knowledge);
  svg.append(path);
  return svg;
}
function menuRow(hash, title, about, icon) {
  const button = el('button', 'menu-row');
  button.type = 'button';
  const text = el('span');
  const name = el('b');
  name.textContent = title;
  const line = el('small');
  line.textContent = about;
  text.append(name, line);
  button.append(pixelIcon(icon), text);
  const back = sectionReturn;
  button.addEventListener('click', () => {
    query = '';
    if (hash.startsWith('app/')) openApp(hash.slice(4), back);
    else go(`#/${hash}`);
  });
  return button;
}
function maxApp() {
  const bridge = window.WebApp;
  return bridge && typeof bridge.ready === 'function' ? bridge : null;
}
function syncBridge() {
  const bridge = maxApp();
  if (!bridge) return;
  bridge.ready();
  if (!startSeen) {
    startSeen = true;
    const start = bridge.initDataUnsafe && bridge.initDataUnsafe.start_param;
    if (start && byId.has(start) && (location.hash === '' || location.hash === '#/')) go(`#/app/${start}`);
  }
  if (bridge.BackButton && !backWired) {
    bridge.BackButton.onClick(goUp);
    backWired = true;
  }
  if (bridge.BackButton) {
    if (route().name === 'home') bridge.BackButton.hide();
    else bridge.BackButton.show();
  }
}
function readFilm() {
  try { return JSON.parse(localStorage.getItem(FILM_KEY)) || []; }
  catch { return []; }
}
function writeFilm(items) {
  try { localStorage.setItem(FILM_KEY, JSON.stringify(items.slice(0, 24))); }
  catch { /* private mode keeps the session on screen only */ }
}
function matches(app) {
  const hay = `${app.name} ${app.tagline} ${app.summary}`.toLocaleLowerCase('ru');
  return hay.includes(query.trim().toLocaleLowerCase('ru'));
}
function ordered(studio) {
  const own = catalog.apps.filter((app) => app.studio === studio);
  if (studio === 'audio') return [{ title: 'Звук', apps: own }];
  const groups = studio === 'video'
    ? catalog.videoTabs.map((tab) => ({ title: TAB[tab.id] || tab.id, ids: tab.apps }))
    : catalog.categories.map((cat) => ({ title: CATEGORY[cat.id] || cat.id, ids: cat.apps }));
  const listed = new Set();
  const built = groups.map((group) => {
    const apps = group.ids.map((id) => byId.get(id)).filter((app) => app && app.studio === studio && !listed.has(app.id));
    apps.forEach((app) => listed.add(app.id));
    return { title: group.title, apps };
  }).filter((group) => group.apps.length);
  const rest = own.filter((app) => !listed.has(app.id));
  if (rest.length) built.push({ title: 'Ещё', apps: rest });
  return built;
}
function header() {
  const bar = el('header', 'top');
  const back = el('button', 'icon');
  back.type = 'button';
  back.textContent = route().name === 'home' ? '' : '‹';
  back.setAttribute('aria-label', 'Назад');
  if (route().name === 'home') {
    back.style.visibility = 'hidden';
    back.tabIndex = -1;
  }
  back.addEventListener('click', goUp);
  const title = el('div', 'brand');
  const mark = el('div', 'mark');
  mark.setAttribute('aria-hidden', 'true');
  const words = el('div', 'brand-copy');
  const heading = el('h1');
  const max = el('span', 'max');
  max.textContent = 'max';
  const ai = el('span', 'ai');
  ai.textContent = 'AI';
  heading.append(max, ai);
  const tag = el('p', 'tag');
  tag.textContent = 'ИИ-студия прямо в MAX';
  words.append(heading, tag);
  title.append(mark, words);
  const film = el('button', 'icon');
  film.type = 'button';
  film.textContent = '▣';
  film.setAttribute('aria-label', 'Плёнка');
  film.addEventListener('click', () => go('#/film'));
  bar.append(back, title, film);
  return bar;
}
function searchField() {
  const input = el('input', 'find');
  input.type = 'search';
  input.placeholder = 'Название инструмента';
  input.value = query;
  input.setAttribute('aria-label', 'Поиск');
  input.addEventListener('input', () => {
    query = input.value;
    const box = document.querySelector('#results');
    if (box) box.replaceChildren(...listNodes());
  });
  return input;
}
function toolButton(app) {
  const button = el('button', 'card');
  button.type = 'button';
  const name = el('b');
  name.textContent = app.name;
  if (app.status === 'draft') {
    const chip = el('span', 'draft');
    chip.textContent = ' Черновик';
    name.append(chip);
  }
  button.append(name);
  const line = el('small');
  line.textContent = app.tagline || app.summary;
  button.append(line);
  button.addEventListener('click', () => openApp(app.id, sectionReturn || `#/studio/${app.studio}`));
  return button;
}
function listNodes() {
  const current = route();
  if (!query.trim() && current.name === 'home') {
    const start = el('h2');
    start.textContent = 'С чего начать';
    return [start, ...catalog.start.map((id) => byId.get(id)).filter(Boolean).map(toolButton)];
  }
  const apps = current.name === 'studio'
    ? catalog.apps.filter((app) => app.studio === current.studio && matches(app))
    : catalog.apps.filter(matches);
  if (!query.trim() && current.name === 'studio') {
    return ordered(current.studio).flatMap((group) => {
      const title = el('h2');
      title.textContent = group.title;
      return [title, ...group.apps.map(toolButton)];
    });
  }
  if (!apps.length) {
    const empty = el('p');
    empty.textContent = 'Ничего не нашлось.';
    return [empty];
  }
  return apps.map(toolButton);
}
function homeMain() {
  const stage = el('div', 'stage');
  const menu = el('nav', 'menu');
  menu.setAttribute('aria-label', 'Главное меню');
  const icons = { profile: 'profile', favorites: 'favorites', text: 'text', 'studio/image': 'image', 'studio/video': 'video', 'studio/audio': 'audio', trends: 'trends', school: 'school', knowledge: 'knowledge' };
  for (const [hash, title, about] of MENU) menu.append(menuRow(hash, title, about, icons[hash]));
  const foot = el('p', 'foot');
  foot.append(document.createTextNode('Каталог: '));
  const link = el('a');
  link.href = catalog.source;
  link.textContent = 'Freefield';
  link.rel = 'noopener';
  link.addEventListener('click', (event) => {
    const bridge = maxApp();
    if (bridge && typeof bridge.openLink === 'function') {
      event.preventDefault();
      bridge.openLink(link.href);
    }
  });
  foot.append(link, document.createTextNode(`, MIT, © 2026 Sammir Femat. ${catalog.apps.length} инструментов. Модель на этом экране не подключена.`));
  stage.append(menu, foot);
  return stage;
}
function pageStage(title, node) {
  const stage = el('div', 'stage');
  const heading = el('h2');
  heading.textContent = title;
  stage.append(heading, node);
  return stage;
}
function profileMain() {
  const box = el('form', 'note');
  const lead = el('p');
  lead.textContent = 'Имя хранится только на этом устройстве. Облачного профиля нет.';
  const label = el('label', 'field');
  label.textContent = 'Как к вам обращаться';
  const input = el('input');
  input.type = 'text';
  input.maxLength = 40;
  input.value = localStorage.getItem(NAME_KEY) || '';
  label.append(input);
  const save = el('button', 'submit');
  save.type = 'submit';
  save.textContent = 'Сохранить';
  const status = el('p', 'warn');
  box.append(lead, label, save, status);
  box.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
    status.textContent = name ? `Сохранено: ${name}` : 'Имя очищено';
  });
  return pageStage('Профиль', box);
}
function favoritesMain() {
  sectionReturn = '#/favorites';
  const box = el('div', 'menu');
  const ids = readList(FAV_KEY).filter((id) => byId.has(id));
  if (!ids.length) {
    const empty = el('p');
    empty.textContent = 'Пока пусто. Откройте инструмент и нажмите «В избранное».';
    box.append(empty);
  }
  for (const id of ids) {
    const app = byId.get(id);
    box.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, app.studio === 'video' ? 'video' : app.studio === 'audio' ? 'audio' : 'image'));
  }
  return pageStage('Избранное', box);
}
function textMain() {
  const box = el('div');
  const lead = el('p', 'note');
  lead.textContent = 'Отдельная текстовая модель здесь не подключена. Ниже инструменты каталога, где вы задаёте слова, и черновик, который остаётся на устройстве.';
  const draft = el('label', 'field');
  draft.textContent = 'Черновик';
  const area = el('textarea');
  area.rows = 4;
  area.value = localStorage.getItem('maxai.draft') || '';
  area.addEventListener('input', () => { try { localStorage.setItem('maxai.draft', area.value); } catch { /* private mode */ } });
  draft.append(area);
  const list = el('div', 'menu');
  sectionReturn = '#/text';
  for (const id of TEXT_IDS) {
    const app = byId.get(id);
    if (app) list.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, 'text'));
  }
  box.append(lead, draft, list);
  return pageStage('Текстовые ИИ', box);
}
function trendsMain() {
  const box = el('div', 'menu');
  sectionReturn = '#/trends';
  for (const id of catalog.start || []) {
    const app = byId.get(id);
    if (app) box.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, 'trends'));
  }
  return pageStage('Тренды', box);
}
function schoolMain() {
  const box = el('div', 'note');
  const lessons = [
    ['Кадр', 'Генерация изображений берёт описание и показывает демонстрационный кадр. Модель к этой сборке не подключена.'],
    ['Ролик', 'Генерация видео продолжает кадр. Сначала соберите картинку, потом откройте видеоинструмент.'],
    ['Звук', 'Генерация аудио добавляет музыку или эффект к сцене. Текст песни можно набросать в «Текстовые ИИ».'],
    ['Фильтр', 'Перед публикацией в каналы слова и домены из ограничений вырезают рекламу. Здесь, в студии, этот фильтр не работает.'],
  ];
  for (const [title, text] of lessons) {
    const line = el('p');
    const name = el('b');
    name.textContent = `${title}. `;
    line.append(name, document.createTextNode(text));
    box.append(line);
  }
  return pageStage('Школа ИИ', box);
}
function knowledgeMain() {
  const box = el('div', 'note');
  const lines = [
    'Профиль хранит имя только на этом устройстве.',
    'Избранное собирает инструменты, которые вы отметили.',
    'Текстовые ИИ — черновик и инструменты, где нужны слова.',
    'Генерация изображений открывает каталог кадров.',
    'Генерация видео открывает каталог роликов.',
    'Генерация аудио открывает каталог звука.',
    'Тренды показывает стартовый список каталога Freefield.',
    'Школа ИИ объясняет, что делает каждая студия.',
    'База знаний — эта страница.',
  ];
  for (const text of lines) {
    const line = el('p');
    line.textContent = text;
    box.append(line);
  }
  return pageStage('База знаний', box);
}
function studioMain() {
  sectionReturn = `#/studio/${route().studio}`;
  const stage = el('div', 'stage');
  const title = el('h2');
  title.textContent = STUDIO[route().studio][0];
  const results = el('div');
  results.id = 'results';
  results.append(...listNodes());
  stage.append(searchField(), title, results);
  return stage;
}
function controlFor(input) {
  let control;
  if (input.type === 'textarea') {
    control = el('textarea');
    control.rows = 4;
  } else if (input.type === 'select') {
    control = el('select');
    for (const option of input.options || []) {
      const node = el('option');
      node.value = option.value == null ? '' : String(option.value);
      node.textContent = option.label;
      control.append(node);
    }
  } else if (input.type === 'toggle') {
    control = el('input');
    control.type = 'checkbox';
    control.checked = Boolean(input.default);
  } else if (input.type === 'slider') {
    control = el('input');
    control.type = 'range';
    control.min = input.min;
    control.max = input.max;
    control.step = input.step || 1;
  } else if (input.type === 'seed' || input.type === 'number') {
    control = el('input');
    control.type = 'number';
    if (input.min != null) control.min = input.min;
    if (input.max != null) control.max = input.max;
    if (input.step != null) control.step = input.step;
  } else if (input.type === 'image' || input.type === 'video' || input.type === 'audio') {
    control = el('input');
    control.type = 'file';
    control.accept = `${input.type}/*`;
    if (input.multiple) control.multiple = true;
  } else {
    control = el('input');
    control.type = 'text';
  }
  control.name = input.id;
  if (input.type !== 'toggle' && input.type !== 'image' && input.type !== 'video' && input.type !== 'audio' && input.default != null) {
    control.value = input.default;
  }
  return control;
}
function fieldNode(input) {
  const wrap = el('label', `field${input.type === 'toggle' ? ' toggle' : ''}`);
  const name = el('span');
  name.textContent = input.label;
  const control = controlFor(input);
  if (input.type === 'toggle') wrap.append(control, name);
  else wrap.append(name, control);
  if (input.type === 'slider') {
    const value = el('b');
    value.textContent = control.value;
    control.addEventListener('input', () => { value.textContent = control.value; });
    wrap.append(value);
  }
  if (input.type === 'file' || input.type === 'image' || input.type === 'video' || input.type === 'audio') {
    const preview = el('img');
    preview.hidden = true;
    preview.alt = '';
    control.addEventListener('change', () => {
      if (preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
      const file = control.files && control.files[0];
      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        previews.push(url);
        preview.src = url;
        preview.hidden = false;
      } else preview.hidden = true;
    });
    wrap.append(preview);
  }
  const note = el('small');
  note.textContent = input.paint ? 'Кисть для маски появится вместе с API.' : (input.help || '');
  if (note.textContent) wrap.append(note);
  return { wrap, control };
}
function valuesOf(form) {
  const values = {};
  for (const node of form.elements) {
    if (!node.name) continue;
    if (node.type === 'checkbox') values[node.name] = node.checked;
    else if (node.type === 'file') values[node.name] = node.files && node.files.length ? node.files[0].name : '';
    else values[node.name] = node.value;
  }
  return values;
}
function appMain(app) {
  const form = el('form', 'tool');
  const stage = el('div', 'stage');
  const heading = el('h2');
  heading.textContent = app.name;
  const lead = el('p');
  lead.textContent = app.tagline || app.summary;
  const chips = el('div', 'chips');
  for (const text of [STUDIO[app.studio][0], app.model, app.feature].filter(Boolean)) {
    const chip = el('span');
    chip.textContent = text;
    chips.append(chip);
  }
  if (app.status === 'draft') {
    const chip = el('span', 'draft');
    chip.textContent = 'Черновик';
    chips.append(chip);
  }
  const star = el('button', 'ghost');
  star.type = 'button';
  const favs = () => readList(FAV_KEY);
  const marked = () => favs().includes(app.id);
  star.textContent = marked() ? 'В избранном' : 'В избранное';
  star.addEventListener('click', () => {
    const next = marked() ? favs().filter((id) => id !== app.id) : [app.id, ...favs().filter((id) => id !== app.id)].slice(0, 40);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    star.textContent = marked() ? 'В избранном' : 'В избранное';
  });
  stage.append(heading, lead, chips, star);
  if (app.tagline && app.summary) {
    const summary = el('p');
    summary.textContent = app.summary;
    stage.append(summary);
  }
  const fields = app.inputs.map(fieldNode);
  const prompt = app.layout === 'composer' ? fields.find((field) => field.control.tagName === 'TEXTAREA') : null;
  for (const field of fields) if (field !== prompt) stage.append(field.wrap);
  const warn = el('p', 'warn');
  warn.setAttribute('role', 'status');
  const result = el('div', 'result');
  result.hidden = true;
  stage.append(warn, result);
  const dock = el('div', 'dock');
  const submit = el('button', 'submit');
  submit.type = 'submit';
  submit.textContent = 'Собрать';
  if (prompt) {
    prompt.control.placeholder = 'Опишите кадр';
    dock.append(prompt.wrap, submit);
  } else dock.append(submit);
  form.append(stage, dock);
  form.addEventListener('input', () => {
    const bridge = maxApp();
    const dirty = Array.from(form.elements).some((node) => node.type !== 'submit' && String(node.value || '').trim());
    if (dirty && bridge && typeof bridge.enableClosingConfirmation === 'function') bridge.enableClosingConfirmation();
    if (!dirty && bridge && typeof bridge.disableClosingConfirmation === 'function') bridge.disableClosingConfirmation();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = valuesOf(form);
    const built = buildDemo(app, values);
    if (!built.ok) {
      warn.textContent = built.message;
      return;
    }
    const mine = ++job;
    submit.disabled = true;
    warn.textContent = '';
    result.hidden = false;
    result.replaceChildren();
    const bars = el('div', 'bars');
    bars.setAttribute('role', 'status');
    bars.setAttribute('aria-label', 'Сборка демонстрации');
    for (let i = 0; i < 5; i += 1) bars.append(el('i'));
    result.append(bars);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 1400));
    if (mine !== job) return;
    submit.disabled = false;
    const photo = el('img');
    photo.src = built.plate;
    photo.alt = 'Демонстрационный кадр';
    const scan = el('div', 'scan');
    const caption = el('p');
    const line = el('b');
    line.textContent = built.message || 'Демонстрация. Модель не подключена.';
    const quote = el('span', 'quote');
    quote.textContent = String(values.prompt || app.name).slice(0, 280);
    caption.append(line, document.createElement('br'), quote);
    result.replaceChildren(photo, scan, caption);
    const film = readFilm().filter((item) => item.appId !== app.id || item.prompt !== quote.textContent);
    film.unshift({ appId: app.id, prompt: quote.textContent, plate: built.plate, at: Date.now() });
    writeFilm(film);
  });
  return form;
}
function filmMain() {
  const stage = el('div', 'stage');
  const title = el('h2');
  title.textContent = 'Плёнка';
  stage.append(title);
  const items = readFilm();
  if (!items.length) {
    const empty = el('p');
    empty.textContent = 'Пока пусто. Соберите кадр в инструменте.';
    stage.append(empty);
    return stage;
  }
  for (const item of items) {
    const app = byId.get(item.appId);
    const card = el('article', 'card');
    const photo = el('img');
    photo.src = item.plate;
    photo.alt = '';
    const name = el('b');
    name.textContent = app ? app.name : item.appId;
    const quote = el('small', 'quote');
    quote.textContent = item.prompt;
    const drop = el('button', 'ghost');
    drop.type = 'button';
    drop.textContent = 'Убрать';
    drop.addEventListener('click', () => {
      writeFilm(readFilm().filter((saved) => saved.at !== item.at));
      paint();
    });
    card.append(photo, name, quote, drop);
    if (app) card.addEventListener('click', (event) => {
      if (event.target !== drop) go(`#/app/${app.id}`);
    });
    stage.append(card);
  }
  return stage;
}
function dockNav() {
  const current = route();
  if (current.name === 'home' || current.name === 'app') return null;
  const nav = el('nav', 'dock nav');
  const home = el('button');
  home.type = 'button';
  home.textContent = 'Меню';
  home.addEventListener('click', () => go('#/'));
  nav.append(home);
  return nav;
}
function paint() {
  job += 1;
  for (const url of previews) URL.revokeObjectURL(url);
  previews = [];
  const current = route();
  const screens = { profile: profileMain, favorites: favoritesMain, text: textMain, trends: trendsMain, school: schoolMain, knowledge: knowledgeMain };
  const main = current.name === 'app' ? appMain(current.app)
    : current.name === 'studio' ? studioMain()
    : current.name === 'film' ? filmMain()
    : screens[current.name] ? screens[current.name]()
    : homeMain();
  const nodes = [header(), main];
  const nav = dockNav();
  if (nav) nodes.push(nav);
  root.replaceChildren(...nodes);
  syncBridge();
}
addEventListener('hashchange', paint);
addEventListener('keydown', (event) => { if (event.key === 'Escape') goUp(); });
paint();
let tries = 0;
const bridgeTimer = setInterval(() => {
  tries += 1;
  syncBridge();
  if (maxApp() || tries > 20) clearInterval(bridgeTimer);
}, 150);
