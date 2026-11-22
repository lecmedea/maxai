const PLATES = ['assets/plate-a.jpg', 'assets/plate-b.jpg', 'assets/plate-c.jpg', 'assets/plate-d.jpg'];

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  return hash;
}

export function buildDemo(app, values) {
  const missing = (app.inputs || []).find((input) => input.required && String(values[input.id] ?? '').trim() === '');
  if (missing) return { ok: false, message: `Заполните «${missing.label}».` };
  const seed = hashCode(`${app.id}\n${values.prompt ?? ''}\n${values.seed ?? ''}`);
  return {
    ok: true,
    plate: PLATES[Math.abs(seed) % PLATES.length],
    message: 'Демонстрация. Модель не подключена.',
    title: app.name,
  };
}
