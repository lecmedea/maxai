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
  ['profile', 'Я', 'Как к тебе обращаться'],
  ['favorites', 'Любимое', 'Что ты отложил'],
  ['text', 'Тексты', 'Черновик и слова'],
  ['studio/image', 'Картинки', 'Кадр по описанию'],
  ['studio/video', 'Ролики', 'Сначала картинка'],
  ['studio/audio', 'Звук', 'Песня или эффект'],
  ['trends', 'Старт', 'С чего проще начать'],
  ['school', 'Уроки', 'Четыре короткие заметки'],
  ['knowledge', 'Подсказки', 'Что где лежит'],
];
const BANNER = {
  profile: ['Я', 'Напиши, как к тебе обращаться. Имя останется только на этом телефоне. Ниже два одинаковых блока: поле с именем и заметка.'],
  favorites: ['Любимое', 'Сюда падает всё, что ты сам отложил. Открой инструмент и нажми «В избранное». Карточки стоят по две в ряд.'],
  text: ['Тексты', 'Слева черновик, справа короткая заметка. Ниже четыре инструмента, где тоже нужны слова. Модель пока не отвечает.'],
  trends: ['Старт', 'Пять инструментов, с которых проще всего начать. Они стоят по два в ряд.'],
  school: ['Уроки', 'Четыре короткие заметки: кадр, ролик, звук и фильтр. Блоки одного размера, по два в ряд.'],
  knowledge: ['Подсказки', 'Что лежит в каждом разделе. Один блок — один раздел, все блоки одинаковые.'],
  film: ['Плёнка', 'Здесь кадры, которые ты уже собирал на этом телефоне. Они лежат по два в ряд.'],
  image: ['Картинки', 'Пишешь, что хочешь увидеть. Цыплёнок показывает пробный кадр. Настоящая модель сюда ещё не подключена. Ниже поиск и инструменты по два в ряд.'],
  video: ['Ролики', 'Берёшь кадр и просишь движение. Сначала картинка, потом ролик. Ниже поиск и те же блоки по два в ряд.'],
  audio: ['Звук', 'Сюда слова для песни или звука. Получается пробный звук, не готовый трек. Инструменты ниже стоят по два в ряд.'],
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
function eggMark() {
  const node = el('span', 'egg');
  node.setAttribute('aria-hidden', 'true');
  return node;
}
function menuRow(hash, title, about, pixel) {
  const button = el('button', 'menu-row');
  button.type = 'button';
  const text = el('span');
  const name = el('b');
  if (pixel) name.className = 'pixel-title';
  name.textContent = title;
  const line = el('small');
  line.textContent = about;
  text.append(name, line);
  button.append(eggMark(), text);
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
  if (route().name !== 'home') {
    const back = el('button', 'icon');
    back.type = 'button';
    back.textContent = '‹';
    back.setAttribute('aria-label', 'Назад');
    back.addEventListener('click', goUp);
    bar.append(back);
  }
  const title = el('div', 'brand');
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
  const logo = el('img', 'brand-logo');
  logo.src = 'assets/chick.png';
  logo.alt = '';
  logo.setAttribute('aria-hidden', 'true');
  title.append(words, logo);
  const film = el('button', 'icon film-slot');
  film.type = 'button';
  film.textContent = '▣';
  film.setAttribute('aria-label', 'Плёнка');
  film.addEventListener('click', () => go('#/film'));
  bar.append(title, film);
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
function toolButton(app, group) {
  const button = el('button', 'card');
  button.type = 'button';
  button.append(eggMark());
  if (group) {
    const crumb = el('small');
    crumb.textContent = group;
    button.append(crumb);
  }
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
    return ordered(current.studio).flatMap((group) => group.apps.map((app) => toolButton(app, group.title)));
  }
  if (!apps.length) {
    const empty = el('p', 'span2');
    empty.textContent = 'Ничего не нашлось.';
    return [empty];
  }
  return apps.map(toolButton);
}
function homeMain() {
  const stage = el('div', 'stage');
  const menu = el('nav', 'menu');
  menu.setAttribute('aria-label', 'Главное меню');
  for (const [hash, title, about] of MENU) menu.append(menuRow(hash, title, about, true));
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
function shipBanner(name, text) {
  const banner = el('section', 'ship');
  const photo = el('img');
  photo.src = 'assets/chick-ship.png';
  photo.alt = '';
  photo.setAttribute('aria-hidden', 'true');
  const words = el('div');
  const heading = el('h2');
  heading.textContent = name;
  const copy = el('p');
  copy.textContent = text;
  words.append(heading, copy);
  banner.append(photo, words);
  return banner;
}
function withShip(key) {
  const stage = el('div', 'stage');
  const [name, text] = BANNER[key];
  stage.append(shipBanner(name, text));
  return stage;
}
function infoBlock(title, text) {
  const card = el('article', 'block');
  const name = el('b');
  name.textContent = title;
  const body = el('p');
  body.textContent = text;
  card.append(eggMark(), name, body);
  return card;
}
function profileMain() {
  const stage = withShip('profile');
  const grid = el('div', 'grid2 pair');
  const box = el('form', 'block');
  const label = el('label', 'field');
  const caption = el('b');
  caption.textContent = 'Имя';
  const input = el('input');
  input.type = 'text';
  input.maxLength = 40;
  input.placeholder = 'Как к тебе обращаться';
  input.setAttribute('aria-label', 'Как к тебе обращаться');
  input.value = localStorage.getItem(NAME_KEY) || '';
  label.append(caption, input);
  const save = el('button', 'submit');
  save.type = 'submit';
  save.textContent = 'Сохранить';
  const status = el('p', 'warn');
  box.append(eggMark(), label, save, status);
  box.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (name) localStorage.setItem(NAME_KEY, name);
    else localStorage.removeItem(NAME_KEY);
    status.textContent = name ? `Сохранено: ${name}` : 'Имя стёрто';
  });
  grid.append(box, infoBlock('Только здесь', 'Имя никуда не отправляется. Его не видно в каналах и на других телефонах.'));
  stage.append(grid);
  return stage;
}
function favoritesMain() {
  sectionReturn = '#/favorites';
  const stage = withShip('favorites');
  const grid = el('div', 'grid2 even');
  const ids = readList(FAV_KEY).filter((id) => byId.has(id));
  if (!ids.length) {
    grid.append(
      infoBlock('Пока пусто', 'Ты ещё ничего не откладывал.'),
      infoBlock('Как добавить', 'Открой инструмент и нажми «В избранное».'),
    );
  }
  for (const id of ids) {
    const app = byId.get(id);
    grid.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, false));
  }
  stage.append(grid);
  return stage;
}
function textMain() {
  sectionReturn = '#/text';
  const stage = withShip('text');
  const top = el('div', 'grid2 pair');
  const draft = el('label', 'block field');
  const caption = el('b');
  caption.textContent = 'Черновик';
  const area = el('textarea');
  area.rows = 4;
  area.placeholder = 'Пиши своими словами';
  area.value = localStorage.getItem('maxai.draft') || '';
  area.addEventListener('input', () => { try { localStorage.setItem('maxai.draft', area.value); } catch { /* private mode */ } });
  draft.append(eggMark(), caption, area);
  top.append(draft, infoBlock('Пока без модели', 'Слова остаются на этом телефоне. Ответ модели сюда не приходит.'));
  const list = el('div', 'grid2 even');
  for (const id of TEXT_IDS) {
    const app = byId.get(id);
    if (app) list.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, false));
  }
  stage.append(top, list);
  return stage;
}
function trendsMain() {
  sectionReturn = '#/trends';
  const stage = withShip('trends');
  const grid = el('div', 'grid2 even');
  for (const id of catalog.start || []) {
    const app = byId.get(id);
    if (app) grid.append(menuRow(`app/${id}`, app.name, app.tagline || app.summary, false));
  }
  stage.append(grid);
  return stage;
}
function schoolMain() {
  const stage = withShip('school');
  const grid = el('div', 'grid2 even');
  const lessons = [
    ['Кадр', 'Опиши картинку. Пока это пробный кадр: модель не подключена.'],
    ['Ролик', 'Сначала картинка, потом движение.'],
    ['Звук', 'Напиши слова песни или какой звук нужен. Выйдет пробный звук.'],
    ['Фильтр', 'В каналах рекламу режут отдельно. Здесь, в студии, этот фильтр не работает.'],
  ];
  for (const [title, text] of lessons) grid.append(infoBlock(title, text));
  stage.append(grid);
  return stage;
}
function knowledgeMain() {
  const stage = withShip('knowledge');
  const grid = el('div', 'grid2 even');
  const hints = [
    ['Я', 'Имя только на этом телефоне. В каналы оно не уходит.'],
    ['Любимое', 'То, что ты сам отложил кнопкой «В избранное».'],
    ['Тексты', 'Черновик и четыре инструмента, где нужны слова.'],
    ['Картинки', 'Каталог кадров. Сверху поиск, ниже сетка по два.'],
    ['Ролики', 'Каталог движения. Сначала кадр, потом ролик.'],
    ['Звук', 'Каталог песен и эффектов. Пока это пробный звук.'],
    ['Старт', 'Пять инструментов, с которых проще начать.'],
    ['Уроки', 'Четыре заметки: кадр, ролик, звук и фильтр.'],
    ['Подсказки', 'Эта страница. Она говорит, что где лежит.'],
  ];
  for (const [title, text] of hints) grid.append(infoBlock(title, text));
  stage.append(grid);
  return stage;
}
function studioMain() {
  const studio = route().studio;
  sectionReturn = `#/studio/${studio}`;
  const stage = withShip(studio);
  const results = el('div', 'grid2 even');
  results.id = 'results';
  results.append(...listNodes());
  stage.append(searchField(), results);
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
  const stage = withShip('film');
  const items = readFilm();
  const grid = el('div', items.length ? 'grid2 frames' : 'grid2 even');
  if (!items.length) {
    grid.append(
      infoBlock('Пока пусто', 'Собранных кадров ещё нет.'),
      infoBlock('Как появится', 'Собери кадр в любом инструменте — он попадёт сюда.'),
    );
    stage.append(grid);
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
    grid.append(card);
  }
  stage.append(grid);
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
