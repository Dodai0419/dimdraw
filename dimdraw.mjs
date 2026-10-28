#!/usr/bin/env node
// dimdraw: an Apple-style dimensional drawing of a card component, computed from its design tokens,
// written as one static SVG (no browser, no JavaScript at view time).
// Drawing kit and sheet layout ported from enesozturk/dimensional-drawing (MIT), see NOTICE.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Defaults = the card measured in upstream's examples/card-sheet.html.
export const DEFAULTS = {
  name: 'Card', dwg: 'UI-CARD-001', rev: 'B', date: '2026-10-23', source: 'Card Showcase · 20 instances',
  W: 600, Wmin: 420, Wmax: 680, B: 1,
  S1: 14, S2: 12, S3: 12, S4: 12, S5: 8, S6: 4,
  Z1: 16, H3: 36, H4: 22, TH: 20, MH: 32, TW: 88, AW: 150, content: [40, 20],
  R1: 16, R3: 10, Y: 32, BL: 72, SP: -16, T1: 44,
};

/** Every position on the plan, derived from tokens (upstream hard-codes these numbers). */
export function layout(tk) {
  const t = { ...DEFAULTS, ...tk };
  const { W, B, S1, S2, S3, S4, S5, S6, Z1, H3, H4, TH, MH, TW, AW, R1, R3, Y, BL, SP } = t;
  const H1 = 2 * S1 + H3, H2 = H1, R2 = R1 - B - S6, R4 = H3 / 2;
  const E1 = BL + SP - Y, E2 = BL + SP, E3 = BL + SP + Y;
  const hy = B + H1;
  const lead = { x: B + S1, y: B + S1 + (H3 - Z1) / 2, w: Z1, h: Z1 };
  const trail = { x: W - B - S1 - TW, y: B + S1 + (H3 - H4) / 2, w: TW, h: H4, r: R3 };
  const tx0 = lead.x + Z1 + S5;
  const title = { x: tx0, y: B + S1 + (H3 - TH) / 2, w: trail.x - S4 - tx0, h: TH };
  const wellH = 2 * B + 2 * S2 + t.content.reduce((a, b) => a + b, 0) + S3 * (t.content.length - 1);
  const well = { x: B + S6, y: hy, w: W - 2 * (B + S6), h: wellH, r: R2 };
  let sy = hy + B + S2;
  const slots = t.content.map((h) => { const s = { x: well.x + B + S2, y: sy, w: well.w - 2 * (B + S2), h }; sy += h + S3; return s; });
  const fy = hy + wellH;
  const action = { x: W - B - S1 - AW, y: fy + S1, w: AW, h: H3, r: R4 };
  const meta = { x: B + S1, y: fy + S1 + (H3 - MH) / 2, w: action.x - S4 - (B + S1), h: MH };
  const H = fy + H2 + B;
  for (const [k, v] of Object.entries({ R2, E1, E2, E3, 'title width': title.w, 'meta width': meta.w }))
    if (!(v >= 0)) throw new Error(`tokens give a negative ${k} (${v}); check W, S*, R1, B, shadow`);
  return { t, H, H1, H2, R2, R4, E1, E2, E3, hy, fy, lead, trail, title, well, slots, action, meta };
}

export function tables(L) {
  const { t } = L;
  return {
    Spacing: [['S1', 'card-pad', t.S1], ['S2', 'well-pad', t.S2], ['S3', 'stack-gap', t.S3], ['S4', 'gap-min', t.S4], ['S5', 'lead-gap', t.S5], ['S6', 'well-inset', t.S6]],
    Size: [['B', 'border', t.B], ['Z1', 'lead-size', t.Z1], ['H3', 'action-h', t.H3], ['H4', 'trail-h', t.H4], ['H1', 'header-min', `2·S1+H3 = ${L.H1}`], ['H2', 'footer-h', `2·S1+H3 = ${L.H2}`], ['W', 'card-w', `${t.Wmin}–${t.Wmax}`]],
    Radius: [['R1', 'r-card', t.R1], ['R2', 'r-well', `R1−B−S6 = ${L.R2}`], ['R3', 'r-trail', t.R3], ['R4', 'r-pill', 'h ÷ 2']],
    Shadow: [['Y', 'shadow-y', t.Y], ['BL', 'shadow-blur', t.BL], ['SP', 'shadow-spread', String(t.SP).replace('-', '−')], ['E1', 'env-top', `BL+SP−Y = ${L.E1}`], ['E2', 'env-side', `BL+SP = ${L.E2}`], ['E3', 'env-bottom', `BL+SP+Y = ${L.E3}`]],
  };
}

const CSS = `.u{font-family:var(--f)}svg{--ink:#111;--ink2:#444;--ink3:#7a7a7a;--fill:#f3f3f3;--fill2:#e6e6e6;--sheet:#fff;--f:Arimo,'Helvetica Neue',Helvetica,Arial,sans-serif}
.bg{fill:#fff}.border{fill:none;stroke:var(--ink);stroke-width:1.2}.obj{fill:var(--sheet);stroke:var(--ink);stroke-width:1.6;stroke-linejoin:round}
.well{fill:var(--fill);stroke:var(--ink);stroke-width:1}.slot{fill:none;stroke:var(--ink2);stroke-width:.8;stroke-dasharray:4 3}
.hug{fill:var(--fill2);stroke:var(--ink);stroke-width:1}.thin{fill:none;stroke:var(--ink);stroke-width:.8}
.ph{fill:none;stroke:var(--ink3);stroke-width:.8;stroke-dasharray:14 3 3 3}.cl{fill:none;stroke:var(--ink3);stroke-width:.7;stroke-dasharray:16 3 2 3}
.dl{stroke:var(--ink);stroke-width:.7;fill:none}.ext{stroke:var(--ink);stroke-width:.55;fill:none}.arrow{fill:var(--ink)}
.hl{stroke:var(--ink2);stroke-width:.7}.hs{stroke:var(--ink);stroke-width:.8}.env{fill:none;stroke:var(--ink);stroke-width:.8;stroke-dasharray:10 3 2 3}
.dt{font:400 11px var(--f);fill:var(--ink);paint-order:stroke;stroke:var(--sheet);stroke-width:4px;stroke-linejoin:round}
.dts{font:400 9.5px var(--f);fill:var(--ink2);letter-spacing:.06em;text-transform:uppercase;paint-order:stroke;stroke:var(--sheet);stroke-width:3px}
.sl{font:400 9px var(--f);fill:var(--ink2);letter-spacing:.08em;text-transform:uppercase}
.nt{font:400 11.5px var(--f);fill:var(--ink);letter-spacing:.06em;text-transform:uppercase}.nth{font:700 13px var(--f);fill:var(--ink);letter-spacing:.06em}
.vt{font:400 12px var(--f);fill:var(--ink);letter-spacing:.1em;text-transform:uppercase}.big{font:400 40px var(--f);fill:var(--ink);letter-spacing:.1em;text-transform:uppercase}
.nb{fill:var(--sheet);stroke:var(--ink);stroke-width:.9}.nbt{font:400 9.5px var(--f);fill:var(--ink)}.lead{stroke:var(--ink);stroke-width:.7;fill:none}.dot{fill:var(--ink)}
.th{font:400 10.5px var(--f);fill:var(--ink);letter-spacing:.05em;text-transform:uppercase}.tc{font:400 10.5px var(--f);fill:var(--ink)}
.lbl{font:400 9.5px var(--f);fill:var(--ink2);letter-spacing:.06em;text-transform:uppercase}.v{font:400 13px var(--f);fill:var(--ink);letter-spacing:.05em;text-transform:uppercase}.fv{font:400 18px var(--f);fill:var(--ink);letter-spacing:.06em}`;
const ANIM = `@keyframes dd-in{from{opacity:0}}.a{animation:dd-in .5s both}`;

const r2 = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Render the whole sheet. opts.animate: elements fade in in drawing order (CSS, plays in <img>). */
export function render(tokens = {}, opts = {}) {
  const L = layout(tokens), { t, H } = L, W = t.W;
  const out = [];
  let n = 0;
  const mk = (tag, a, p = out, body) => {
    if (opts.animate && p === out) a = { ...a, class: (a.class || '') + ' a', style: `animation-delay:${(n++ * 0.012).toFixed(3)}s` };
    const at = Object.entries(a).filter(([, v]) => v != null).map(([k, v]) => ` ${k}="${esc(r2(v))}"`).join('');
    p.push(body == null ? `<${tag}${at}/>` : `<${tag}${at}>${esc(body)}</${tag}>`);
  };
  const tx = (x, y, s, c = 'dt', a = {}, p) => mk('text', { x, y, class: c, ...a }, p, s);
  const A = 'url(#ar)', HAT = 'url(#hat)';
  const rr = (x, y, w, h, r, c, p) => mk('rect', { x, y, width: w, height: h, rx: r, class: c }, p);

  // ---- kit (same signatures and conventions as upstream's SKILL.md) ----
  function dimH(x1, x2, y, e1, e2, l, o = {}) {
    for (const [x, e] of [[x1, e1], [x2, e2]]) { if (e == null) continue; const s = Math.sign(y - e) || 1; mk('line', { x1: x, y1: e + s * 3, x2: x, y2: y + s * 5, class: 'ext' }); }
    if (x2 - x1 >= 28) mk('line', { x1, y1: y, x2, y2: y, class: 'dl', 'marker-start': A, 'marker-end': A });
    else { mk('line', { x1: x1 - 13, y1: y, x2: x1, y2: y, class: 'dl', 'marker-end': A }); mk('line', { x1: x2 + 13, y1: y, x2, y2: y, class: 'dl', 'marker-end': A }); mk('line', { x1, y1: y, x2, y2: y, class: 'dl' }); }
    tx((x1 + x2) / 2 + (o.dx || 0), (o.below ? y + 13 : y - 4) + (o.dy || 0), l, o.c || 'dt', { 'text-anchor': 'middle' });
  }
  function dimV(y1, y2, x, e1, e2, l, o = {}) {
    for (const [y, e] of [[y1, e1], [y2, e2]]) { if (e == null) continue; const s = Math.sign(x - e) || 1; mk('line', { x1: e + s * 3, y1: y, x2: x + s * 5, y2: y, class: 'ext' }); }
    if (y2 - y1 >= 28) mk('line', { x1: x, y1, x2: x, y2, class: 'dl', 'marker-start': A, 'marker-end': A });
    else { mk('line', { x1: x, y1: y1 - 13, x2: x, y2: y1, class: 'dl', 'marker-end': A }); mk('line', { x1: x, y1: y2 + 13, x2: x, y2, class: 'dl', 'marker-end': A }); mk('line', { x1: x, y1, x2: x, y2, class: 'dl' }); }
    const c = (y1 + y2) / 2;
    if (o.side) { const r = o.side === 'r'; tx(r ? x + 6 : x - 6, c + 4, l, o.c || 'dt', { 'text-anchor': r ? 'start' : 'end' }); }
    else tx(x - 5, c, l, o.c || 'dt', { 'text-anchor': 'middle', transform: `rotate(-90 ${r2(x - 5)} ${r2(c)})` });
  }
  function callout(px, py, ex, ey, l, dir) {
    const s = dir || (ex >= px ? 1 : -1);
    mk('circle', { cx: px, cy: py, r: 1.8, class: 'dot' });
    mk('polyline', { points: [px, py, ex, ey, ex + s * 10, ey].map(r2).join(' '), class: 'lead' });
    tx(ex + s * 14, ey + 4, l, 'dt', { 'text-anchor': s > 0 ? 'start' : 'end' });
  }
  function rad(cx, cy, r, c, l, len) {
    const sx = c.includes('l') ? -1 : 1, sy = c.includes('t') ? -1 : 1, ox = cx - sx * r, oy = cy - sy * r;
    const px = ox + sx * r * Math.SQRT1_2, py = oy + sy * r * Math.SQRT1_2;
    callout(px, py, px + sx * len, py + sy * len, l, sx);
  }
  const nb = (x, y, k) => { mk('rect', { x: x - 6, y: y - 6, width: 12, height: 12, class: 'nb' }); tx(x, y + 3.5, String(k), 'nbt', { 'text-anchor': 'middle' }); };
  const slotLabel = (x, y, w, h, l, al) => tx(al === 'l' ? x + 6 : x + w / 2, y + h / 2 + 3.2, l, 'sl', { 'text-anchor': al === 'l' ? 'start' : 'middle' });
  const title = (x, y, s, sub) => { tx(x, y, s, 'vt', { 'text-anchor': 'middle' }); if (sub) tx(x, y + 14, sub, 'dts', { 'text-anchor': 'middle' }); };
  function detailRef(cx, cy, r, lbl, lx, ly) {
    mk('circle', { cx, cy, r, class: 'ph' });
    const a = Math.atan2(ly - cy, lx - cx);
    mk('line', { x1: cx + r * Math.cos(a), y1: cy + r * Math.sin(a), x2: lx, y2: ly, class: 'lead' });
    tx(lx + (lx < cx ? -4 : 4), ly + 4, lbl, 'dts', { 'text-anchor': lx < cx ? 'end' : 'start' });
  }
  function table(x, y, ttl, rows) {
    const ws = [40, 88, 96], rh = 17;
    tx(x, y - 8, ttl, 'vt');
    [['Code', 'Variable', 'Value'], ...rows].forEach((r, i) => {
      let cx = x;
      r.forEach((c, j) => { rr(cx, y + i * rh, ws[j], rh, null, 'thin'); tx(cx + (j ? ws[j] / 2 : 6), y + i * rh + 12, c, i ? 'tc' : 'th', { 'text-anchor': j ? 'middle' : 'start' }); cx += ws[j]; });
    });
    return y + (rows.length + 1) * rh + 36;
  }

  // ---- plan geometry at scale k, origin (ox, oy) ----
  function cardPlan(ox, oy, k, g) {
    const X = (v) => ox + v * k, Yp = (v) => oy + v * k;
    const box = (b, c, lbl, al) => { rr(X(b.x), Yp(b.y), b.w * k, b.h * k, (b.r ?? 2) * k, c, g); if (lbl && k >= 0.7) slotLabel(X(b.x), Yp(b.y), b.w * k, b.h * k, lbl, al); };
    rr(X(0), Yp(0), W * k, H * k, t.R1 * k, 'obj', g);
    for (const y of [L.hy, L.fy]) mk('line', { x1: X(t.B), y1: Yp(y), x2: X(W - t.B), y2: Yp(y), class: 'ph' }, g);
    box(L.well, 'well');
    const { lead } = L;
    rr(X(lead.x), Yp(lead.y), lead.w * k, lead.h * k, null, 'thin', g);
    mk('path', { d: `M${r2(X(lead.x))},${r2(Yp(lead.y))} L${r2(X(lead.x + lead.w))},${r2(Yp(lead.y + lead.h))} M${r2(X(lead.x + lead.w))},${r2(Yp(lead.y))} L${r2(X(lead.x))},${r2(Yp(lead.y + lead.h))}`, class: 'thin' }, g);
    box(L.title, 'slot', 'Title slot · flex', 'l'); box(L.trail, 'hug', 'Trail');
    L.slots.forEach((s) => box(s, 'slot', 'Content slot · fill'));
    box(L.meta, 'slot', 'Meta slot · flex · wraps', 'l'); box(L.action, 'hug', 'Action');
    return { X, Y: Yp };
  }

  // ---- sheet ----
  const TOP = 190; // title block band above the drawing sheet
  out.push(`<rect class="bg" width="1700" height="${1060 + TOP + 40}"/>`);
  // title block
  rr(20, 20, 1660, TOP - 36, 16, 'border');
  tx(40, 44, 'UI component · dimensional drawing', 'lbl'); tx(40, 88, t.name, 'big');
  tx(40, 112, 'Architecture only: slots, spacing, radii and layers. Content is out of scope.', 'lbl');
  [['Dwg no.', t.dwg], ['Rev', `${t.rev} · ${t.date}`], ['Units', 'CSS px @ 1×'], ['Scale', '1:1 unless noted'], ['Source', t.source]].forEach(([k, v], i) => {
    const x = 640 + i * 170; mk('line', { x1: x - 14, y1: 20, x2: x - 14, y2: 116, class: 'thin' }); tx(x, 44, k, 'lbl'); tx(x, 64, v, 'v');
  });
  mk('line', { x1: 20, y1: 116, x2: 1680, y2: 116, class: 'thin' });
  [['W · card-w', `${t.Wmin}–${t.Wmax}`], ['S1 · card-pad', t.S1], ['S2 · well-pad', t.S2], ['S6 · well-inset', t.S6], ['H1 · header-min', '2·S1 + H3'], ['R1 · r-card', t.R1], ['R2 · r-well', 'R1 − B − S6']].forEach(([k, v], i) => {
    tx(40 + i * 236, 136, k, 'lbl'); tx(40 + i * 236, 160, v, 'fv');
  });
  out.push(`<g transform="translate(0 ${TOP})">`);
  rr(20, 20, 1660, 1020, 16, 'border');

  // notes
  const notes = [[1, 'TITLE SLOT FLEXES (MIN-WIDTH 0) AND WRAPS. HEADER GROWS PAST H1.'], [2, 'BODY WELL INSET S6 FROM CONTAINER. WELL RADIUS R2 = R1 − B − S6 (DERIVED).'], [3, 'TRAIL AND ACTION SLOTS HUG THEIR CONTENT AND NEVER SHRINK.'], [4, 'META SLOT WRAPS BEFORE THE ACTION MOVES.'], [5, 'DO NOT CLIP THE SHADOW: KEEP E1 ABOVE, E2 EACH SIDE, E3 BELOW.'], [6, `WIDTH W BETWEEN ${t.Wmin} MIN AND ${t.Wmax} MAX. HEIGHT HUGS CONTENT.`], [7, `ACTION HIT AREA ${t.T1} MIN ON TOUCH LAYOUTS (H3 DRAWN).`]];
  tx(50, 58, 'NOTES:', 'nth'); tx(112, 58, '(UNLESS OTHERWISE SPECIFIED)', 'nt');
  notes.forEach(([k, s], i) => { const y = 88 + i * 24; nb(56, y - 4, k); tx(72, y, s, 'nt'); });

  // plan view
  {
    const k = Math.min(1.1, 660 / W, 300 / H); // shortcut: upstream scales are the caps; past ~H 400 labels get tight
    const { X, Y } = cardPlan(660 + (660 - W * k) / 2, 290, k);
    const { B, S1 } = t, { lead, title: ti, trail, meta, action, well, hy, fy } = L;
    const c1 = B + S1 + t.H3 / 2, c2 = fy + S1 + t.H3 / 2;
    for (const y of [c1, c2]) mk('line', { x1: X(-16), y1: Y(y), x2: X(W + 16), y2: Y(y), class: 'cl' });
    nb(X(ti.x + ti.w - 11), Y(c1), 1); nb(X(trail.x + trail.w - 10), Y(c1), 3); nb(X(meta.x + meta.w - 11), Y(c2), 4); nb(X(action.x + action.w - 25), Y(c2), 3); nb(X(action.x + action.w - 11), Y(c2), 7);
    const ty = Y(-30);
    dimH(X(B), X(lead.x), ty, Y(0), Y(lead.y), 'S1', { dx: -9 }); dimH(X(lead.x), X(lead.x + lead.w), ty, null, Y(lead.y), 'Z1', { dy: -12 });
    dimH(X(lead.x + lead.w), X(ti.x), ty, null, Y(ti.y), 'S5', { dx: 9 }); dimH(X(ti.x), X(ti.x + ti.w), ty, null, Y(ti.y), 'FLEX', { c: 'dts' });
    dimH(X(ti.x + ti.w), X(trail.x), ty, null, Y(trail.y), 'S4'); dimH(X(trail.x), X(trail.x + trail.w), ty, null, Y(trail.y), 'HUG', { c: 'dts' });
    dimH(X(trail.x + trail.w), X(W - B), ty, null, Y(0), 'S1');
    dimH(X(0), X(W), Y(-62), Y(-34), Y(-34), 'W'); tx(X(W / 2), Y(-80), `W = ${t.Wmin} – ${t.Wmax} · REF ${W}`, 'dts', { 'text-anchor': 'middle' }); nb(X(W / 2 + 72), Y(-84), 6);
    const by = Y(H + 30);
    dimH(X(B), X(meta.x), by, Y(H), Y(meta.y + meta.h), 'S1', { below: true }); dimH(X(meta.x), X(meta.x + meta.w), by, null, Y(meta.y + meta.h), 'FLEX', { below: true, c: 'dts' });
    dimH(X(meta.x + meta.w), X(action.x), by, null, Y(action.y + action.h), 'S4', { below: true }); dimH(X(action.x), X(action.x + action.w), by, null, Y(action.y + action.h), 'HUG', { below: true, c: 'dts' });
    dimH(X(action.x + action.w), X(W - B), by, null, Y(H), 'S1', { below: true });
    const lx = X(-58);
    dimV(Y(B), Y(hy), lx, X(0), X(0), 'H1'); dimV(Y(hy), Y(fy), lx, null, X(well.x), 'HUG', { c: 'dts' }); dimV(Y(fy), Y(H - B), lx, null, X(0), 'H2');
    dimV(Y(0), Y(H), X(-96), X(-62), X(-62), `(REF ${H})`);
    [[B, B + S1, 'S1'], [B + S1, B + S1 + t.H3, 'H3'], [B + S1 + t.H3, hy, 'S1'], [fy, fy + S1, 'S1'], [fy + S1, fy + S1 + t.H3, 'H3'], [fy + S1 + t.H3, H - B, 'S1']]
      .forEach(([a, b, l]) => dimV(Y(a), Y(b), X(W + 40), X(W), X(W), l, { side: 'r' }));
    rad(X(0), Y(H), t.R1 * k, 'bl', 'R1', 22); rad(X(action.x + action.w), Y(action.y + action.h), L.R4 * k, 'br', 'R4', 22);
    detailRef(X(W * 0.8), Y(hy + well.h / 2), 44, 'DETAIL B', X(W * 0.8 - 100), Y(hy + well.h / 2 + 10));
    detailRef(X(well.x + 1), Y(hy + 1), 14, 'DETAIL C', X(well.x + 35), Y(hy - 9));
    title(X(W / 2), Y(H + 78), 'Plan view', `Scale ${r2(k)}:1 · reference W = ${W}`);
  }

  // exploded view (axonometric)
  {
    const sc = Math.min(0.5, 300 / W), TX = 290, TY = 760, gap = 56, a = 0.94 * sc, b = 0.17 * sc, c = -0.34 * sc, d = 0.47 * sc;
    const P = (x, y, z) => [TX + a * x + c * y, TY + b * x + d * y - z];
    const layer = (z, draw) => { const g = []; draw(g); out.push(`<g transform="matrix(${[a, b, c, d, TX, TY - z].map(r2).join(' ')})"${opts.animate ? ` class="a" style="animation-delay:${(n++ * 0.012).toFixed(3)}s"` : ''}>${g.join('')}</g>`); };
    const R = (g, x, y, w, h, r, cls, fill) => mk('rect', { x, y, width: w, height: h, rx: r, class: cls, fill, 'vector-effect': 'non-scaling-stroke' }, g);
    const Ln = (g, y) => mk('line', { x1: t.B, y1: y, x2: W - t.B, y2: y, class: 'ph', 'vector-effect': 'non-scaling-stroke' }, g);
    for (const [x, y] of [[0, 0], [W, 0], [W, H], [0, H]]) { const p1 = P(x, y, gap), p2 = P(x, y, gap * 4); mk('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], class: 'ph' }); }
    layer(0, (g) => R(g, -20, -20, W + 40, H + 40, 0, 'thin'));
    layer(gap, (g) => R(g, -t.SP, t.Y + t.SP, W + 2 * t.SP, H + 2 * t.SP, t.R1, 'hs', HAT));
    layer(gap * 2, (g) => { R(g, 0, 0, W, H, t.R1, 'obj'); Ln(g, L.hy); Ln(g, L.fy); });
    layer(gap * 3, (g) => { const w = L.well, tr = L.trail; R(g, w.x, w.y, w.w, w.h, w.r, 'well'); R(g, tr.x, tr.y, tr.w, tr.h, tr.r, 'hug'); });
    layer(gap * 4, (g) => { const { lead: l, title: ti, meta: m, action: ac } = L; R(g, l.x, l.y, l.w, l.h, 0, 'thin'); R(g, ti.x, ti.y, ti.w, ti.h, 2, 'slot'); L.slots.forEach((s) => R(g, s.x, s.y, s.w, s.h, 2, 'slot')); R(g, m.x, m.y, m.w, m.h, 2, 'slot'); R(g, ac.x, ac.y, ac.w, ac.h, ac.r, 'hug'); });
    const LX = 225;
    [[0, [-20, H + 20], 'L0 · Canvas', 'Page background'], [gap, [-t.SP, H + t.SP + t.Y], 'L1 · Shadow', 'Footprint · Y · BL · SP'], [gap * 2, [0, H], 'L2 · Container', 'R1 · B · header / body / footer'],
      [gap * 3, [L.well.x, L.fy], 'L3 · Inset surfaces', 'Well R2 · trail R3'], [gap * 4, [L.meta.x, L.meta.y + L.meta.h], 'L4 · Slots', 'Title · content · meta · action']]
      .forEach(([z, [x, y], s, st]) => {
        const p = P(x, y, z); mk('circle', { cx: p[0], cy: p[1], r: 1.8, class: 'dot' });
        mk('polyline', { points: [p[0], p[1], LX + 10, p[1], LX, p[1]].map(r2).join(' '), class: 'lead' });
        tx(LX - 4, p[1] - 2, s, 'vt', { 'text-anchor': 'end' }); tx(LX - 4, p[1] + 11, st, 'dts', { 'text-anchor': 'end' });
      });
    title(410, TY + 150, 'Exploded view', 'Axonometric · z gaps not to scale');
  }

  // detail C: nested corner (radii share one center)
  {
    const { R1, B, S6 } = t, K = 72 / R1, CX = 670, CY = 880, Lg = R1 + 20, P = (u, v) => [CX + u * K, CY - v * K];
    const arc = (o, r) => `M${P(o, Lg).map(r2)} L${P(o, R1).map(r2)} A${r2(r * K)} ${r2(r * K)} 0 0 0 ${P(R1, o).map(r2)} L${P(Lg, o).map(r2)}`;
    mk('path', { d: arc(0, R1), class: 'obj', fill: 'none' }); mk('path', { d: arc(B, R1 - B), class: 'thin' }); mk('path', { d: arc(B + S6, L.R2), class: 'thin' });
    const cc = P(R1, R1);
    mk('path', { d: `M${r2(cc[0] - 8)},${r2(cc[1])} h16 M${r2(cc[0])},${r2(cc[1] - 8)} v16`, class: 'thin' });
    [[R1, 'R1', 205], [L.R2, 'R2', 250]].forEach(([r, l, dg], i) => {
      const an = (dg * Math.PI) / 180, ex = cc[0] + r * K * Math.cos(an), ey = cc[1] - r * K * Math.sin(an);
      mk('line', { x1: cc[0], y1: cc[1], x2: ex, y2: ey, class: 'dl', 'marker-end': A });
      tx(i ? (cc[0] + ex) / 2 + 8 : (cc[0] + ex) / 2 - 6, i ? (cc[1] + ey) / 2 + 2 : (cc[1] + ey) / 2 - 6, l, 'dt', { 'text-anchor': i ? 'start' : 'end' });
    });
    dimH(P(0, 0)[0], P(B, 0)[0], P(0, Lg - 4)[1], P(0, Lg)[1], P(B, Lg)[1], 'B', { dx: -10 });
    dimH(P(B, 0)[0], P(B + S6, 0)[0], P(0, Lg - 4)[1], null, P(B + S6, Lg)[1], 'S6', { dx: 12 });
    tx(cc[0] + 12, cc[1] - 12, 'SHARED CENTER', 'dts'); tx(P(R1 * 0.62, Lg - 6)[0], P(R1 * 0.62, Lg - 6)[1], 'R2 = R1 − B − S6', 'dt');
    title(CX + 81, CY + 30, 'Detail C · nested corner', `Scale ${r2(K)}:1`);
  }

  // radius details
  {
    const q = 2.4, y0 = 790;
    [['R1', 'Container', t.R1], ['R2', 'Well', L.R2], ['R3', 'Trail slot', t.R3], ['R4', `Pill (h = H3)`, L.R4]].forEach(([c, nm, r], i) => {
      const x0 = 950 + i * 108, Lr = 30, P = (u, v) => [x0 + u * q, y0 - v * q]; // shortcut: radii above ~28 overflow their 108px cell
      mk('path', { d: `M${P(0, Lr).map(r2)} L${P(0, r).map(r2)} A${r2(r * q)} ${r2(r * q)} 0 0 0 ${P(r, 0).map(r2)} L${P(Lr, 0).map(r2)}`, class: 'obj', fill: 'none' });
      const cc = P(r, r), an = (225 * Math.PI) / 180;
      mk('path', { d: `M${r2(cc[0] - 5)},${r2(cc[1])} h10 M${r2(cc[0])},${r2(cc[1] - 5)} v10`, class: 'thin' });
      mk('line', { x1: cc[0], y1: cc[1], x2: cc[0] + r * q * Math.cos(an), y2: cc[1] - r * q * Math.sin(an), class: 'dl', 'marker-end': A });
      tx(x0 + (Lr * q) / 2 + 6, y0 - Lr * q + 16, c); tx(x0, y0 + 18, nm, 'dts');
    });
    title(1120, y0 + 44, 'Radius details', `Scale ${q}:1`);
  }

  // shadow envelope
  {
    const s = Math.min(0.5, 300 / W), EX = 110, EY = 290, ex = (v) => EX + v * s, ey = (v) => EY + v * s, { E1, E2, E3 } = L;
    mk('rect', { x: ex(-E2), y: ey(-E1), width: (W + 2 * E2) * s, height: (H + E1 + E3) * s, class: 'env' });
    mk('rect', { x: ex(-t.SP), y: ey(t.Y + t.SP), width: (W + 2 * t.SP) * s, height: (H + 2 * t.SP) * s, rx: t.R1 * s, fill: HAT, class: 'hs' });
    mk('rect', { x: ex(0), y: ey(0), width: W * s, height: H * s, rx: t.R1 * s, class: 'obj', 'fill-opacity': 0.85 });
    dimV(ey(-E1), ey(0), ex(W * 0.15), ex(-E2), ex(0), 'E1', { side: 'r' });
    dimH(ex(-E2), ex(0), ey(H + E3 * 0.57), ey(H + E3), ey(H), 'E2', { below: true }); dimH(ex(W), ex(W + E2), ey(H + E3 * 0.57), ey(H), ey(H + E3), 'E2', { below: true });
    dimV(ey(H), ey(H + E3), ex(W / 2), null, null, 'E3', { side: 'r' });
    nb(ex(W + E2) + 14, ey(-E1) + 8, 5);
    title(ex(W / 2), ey(H + E3 + 24) + 34, 'Shadow envelope', `Scale ${r2(s)}:1 · E1 / E2 / E3 from Y, BL, SP`);
  }

  // detail B: body well
  {
    const w = L.well, k = Math.min(0.65, 390 / W, 64 / w.h), BX = 935, BY = 885, X = (v) => BX + v * k, Y = (v) => BY + (v - w.y) * k, { B, S2 } = t;
    for (const x of [0, W]) mk('line', { x1: X(x), y1: Y(w.y - 20), x2: X(x), y2: Y(w.y + w.h + 20), class: 'ph' });
    rr(X(w.x), Y(w.y), w.w * k, w.h * k, w.r * k, 'well');
    L.slots.forEach((s) => { rr(X(s.x), Y(s.y), s.w * k, s.h * k, 2, 'slot'); slotLabel(X(s.x), Y(s.y), s.w * k, s.h * k, 'Content slot · fill'); });
    const s0 = L.slots[0], sl = L.slots[L.slots.length - 1], by = Y(w.y + w.h + 26);
    dimH(X(B), X(w.x), by, Y(w.y + w.h + 20), Y(w.y + w.h), 'S6', { below: true, dx: -10 }); dimH(X(w.x + B), X(s0.x), by, null, Y(sl.y + sl.h), 'S2', { below: true, dx: 8 });
    dimH(X(s0.x), X(s0.x + s0.w), by, null, Y(sl.y + sl.h), 'FILL', { below: true, c: 'dts' }); dimH(X(s0.x + s0.w), X(w.x + w.w - B), by, null, Y(sl.y + sl.h), 'S2', { below: true, dx: -6 });
    dimH(X(w.x + w.w), X(W - B), by, Y(w.y + w.h), Y(w.y + w.h + 20), 'S6', { below: true, dx: 10 });
    const ys = [[w.y + B, s0.y, 'S2'], ...L.slots.slice(1).map((s, i) => [L.slots[i].y + L.slots[i].h, s.y, 'S3']), [sl.y + sl.h, w.y + w.h - B, 'S2']];
    ys.forEach(([a, b, l]) => dimV(Y(a), Y(b), X(W + 26), X(w.x + w.w), X(w.x + w.w), l, { side: 'r' }));
    nb(X(W - 20), Y(w.y - 12), 2);
    title(X(W / 2), 1012, 'Detail B · body well', `Scale ${r2(k)}:1`);
  }

  // variable tables
  { let y = 86; for (const [name, rows] of Object.entries(tables(L))) y = table(1426, y, name, rows); }
  out.push('</g>');
  tx(22, 1060 + TOP + 26, `${t.date}  |  UI COMPONENT REFERENCE`, 'lbl'); tx(1678, 1060 + TOP + 26, `${t.name}, architecture  |  1`, 'lbl', { 'text-anchor': 'end' });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1700 ${1060 + TOP + 40}" role="img" aria-label="${esc(t.name)} dimensional drawing: plan view, shadow envelope, exploded view, nested corner, radius and body well details, variable tables">
<style>${CSS}${opts.animate ? ANIM : ''}</style>
<defs><marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0,1.7 L10,5 L0,8.3 z" class="arrow"/></marker>
<pattern id="hat" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="hl"/></pattern></defs>
${out.join('\n')}
</svg>
`;
}

function cli(argv) {
  const a = { out: null, animate: false, file: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-o' || argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--animate') a.animate = true;
    else if (argv[i] === '-h' || argv[i] === '--help') { console.log('usage: node dimdraw.mjs [tokens.json] [-o card.svg] [--animate]'); return; }
    else a.file = argv[i];
  }
  const tokens = a.file ? JSON.parse(readFileSync(a.file, 'utf8')) : {};
  const t0 = performance.now(), svg = render(tokens, { animate: a.animate }), ms = performance.now() - t0;
  const L = layout(tokens);
  if (a.out) writeFileSync(a.out, svg); else process.stdout.write(svg);
  if (a.out) console.log(`${a.out}: ${L.t.name} ${L.t.W}x${L.H}  H1=${L.H1} R2=${L.R2} E1/E2/E3=${L.E1}/${L.E2}/${L.E3}  ${(svg.length / 1024).toFixed(1)} KB in ${ms.toFixed(1)} ms`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try { cli(process.argv.slice(2)); } catch (e) { console.error('dimdraw: ' + e.message); process.exit(1); }
}
