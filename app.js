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
  return { name: 'home' };
}
function go(hash) { location.hash = hash; }
function goUp() {
  const current = route();
  if (current.name === 'app') go(`#/studio/${current.app.studio}`);
  else if (current.name !== 'home') go('#/');
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
  const title = el('div');
  const mark = el('div', 'mark');
  mark.setAttribute('aria-hidden', 'true');
  const heading = el('h1');
  heading.textContent = 'maxAI';
  title.append(mark, heading);
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
  button.addEventListener('click', () => go(`#/app/${app.id}`));
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
  const hero = el('section', 'hero');
  const photo = el('img');
  photo.src = PLATE.image;
  photo.alt = '';
  const scan = el('div', 'scan');
  const copy = el('p');
  const lead = el('strong');
  lead.textContent = 'maxAI';
  copy.append(lead, document.createTextNode(` · ${catalog.apps.length} инструментов из каталога Freefield. Сборка на экране демонстрационная: модель подключим отдельно.`));
  hero.append(photo, scan, copy);
  const tiles = el('div', 'stack');
  for (const id of Object.keys(STUDIO)) {
    const button = el('button', 'tile');
    button.type = 'button';
    const photoTile = el('img');
    photoTile.src = PLATE[id];
    photoTile.alt = '';
    const text = el('span');
    const name = el('b');
    name.textContent = STUDIO[id][0];
    const about = el('small');
    about.textContent = STUDIO[id][1];
    text.append(name, about);
    const count = el('span', 'count');
    count.textContent = String(catalog.apps.filter((app) => app.studio === id).length);
    button.append(photoTile, text, count);
    button.addEventListener('click', () => { query = ''; go(`#/studio/${id}`); });
    tiles.append(button);
  }
  stage.append(hero, searchField(), tiles);
  const results = el('div');
  results.id = 'results';
  results.append(...listNodes());
  stage.append(results);
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
  foot.append(link, document.createTextNode(', MIT, © 2026 Sammir Femat. Эта страница модель не запускает.'));
  stage.append(foot);
  return stage;
}
function studioMain() {
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
  stage.append(heading, lead, chips);
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
  if (current.name === 'app') return null;
  const nav = el('nav', 'dock nav');
  const home = el('button');
  home.type = 'button';
  home.textContent = 'Мастерская';
  if (current.name === 'home' || current.name === 'studio') home.setAttribute('aria-current', 'page');
  home.addEventListener('click', () => go('#/'));
  const film = el('button');
  film.type = 'button';
  film.textContent = 'Плёнка';
  if (current.name === 'film') film.setAttribute('aria-current', 'page');
  film.addEventListener('click', () => go('#/film'));
  nav.append(home, film);
  return nav;
}
function paint() {
  job += 1;
  for (const url of previews) URL.revokeObjectURL(url);
  previews = [];
  const current = route();
  const main = current.name === 'app' ? appMain(current.app)
    : current.name === 'studio' ? studioMain()
    : current.name === 'film' ? filmMain()
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
