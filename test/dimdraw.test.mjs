import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layout, render, tables } from '../dimdraw.mjs';

// Geometry upstream hard-codes in examples/card-sheet.html (cardPlan + shadow footprint), commit at HEAD on 2026-10-28.
const UPSTREAM = {
  H: 228, hy: 65, fy: 163,
  well: [5, 65, 590, 98, 11], lead: [15, 25, 16, 16], title: [39, 23, 446, 20], trail: [497, 22, 88, 22, 10],
  slots: [[18, 78, 564, 40], [18, 130, 564, 20]], meta: [15, 179, 408, 32], action: [435, 177, 150, 36, 18],
  E: [24, 56, 88], R2: 11, H1: 64,
};
const box = (b) => [b.x, b.y, b.w, b.h, ...(b.r != null && b.r !== 2 ? [b.r] : [])];

test('default tokens reproduce the upstream card geometry exactly', () => {
  const L = layout({});
  assert.equal(L.H, UPSTREAM.H); assert.equal(L.hy, UPSTREAM.hy); assert.equal(L.fy, UPSTREAM.fy);
  for (const k of ['well', 'lead', 'title', 'trail', 'meta', 'action']) assert.deepEqual(box(L[k]), UPSTREAM[k], k);
  assert.deepEqual(L.slots.map(box), UPSTREAM.slots);
  assert.deepEqual([L.E1, L.E2, L.E3], UPSTREAM.E); assert.equal(L.R2, UPSTREAM.R2); assert.equal(L.H1, UPSTREAM.H1);
});

test('tables match upstream VAR values for the default card', () => {
  const T = tables(layout({}));
  assert.deepEqual(T.Radius.map((r) => r[2]), [16, 'R1−B−S6 = 11', 10, 'h ÷ 2']);
  assert.deepEqual(T.Shadow.map((r) => r[2]), [32, 72, '−16', 'BL+SP−Y = 24', 'BL+SP = 56', 'BL+SP+Y = 88']);
  assert.deepEqual(T.Size.map((r) => r[0]), ['B', 'Z1', 'H3', 'H4', 'H1', 'H2', 'W']);
});

test('formulas close for other tokens', () => {
  const L = layout({ S1: 20, H3: 44, R1: 24, B: 2, S6: 6, content: [30, 30, 30], Y: 8, BL: 24, SP: -4 });
  assert.equal(L.H1, 2 * 20 + 44); assert.equal(L.R2, 24 - 2 - 6);
  assert.equal(L.H, L.hy + L.well.h + L.H2 + 2); // overall = header + body + footer + border
  assert.equal(L.slots.length, 3); assert.equal(L.slots[2].y + L.slots[2].h + 12 + 2, L.fy);
  assert.deepEqual([L.E1, L.E2, L.E3], [12, 20, 28]);
});

test('bad tokens fail with a clear message', () => {
  assert.throws(() => layout({ R1: 3, S6: 4 }), /negative R2/);
});

test('sheet: every code on the drawing is in a table, grays only, well-formed', () => {
  const svg = render({});
  const codes = new Set(Object.values(tables(layout({}))).flat().map((r) => r[0]));
  const drawn = [...svg.matchAll(/class="dt"[^>]*>([A-Z]\d?|BL|SP)<\/text>/g)].map((m) => m[1]);
  assert.ok(drawn.length > 30, 'dimension labels drawn');
  for (const c of drawn) assert.ok(codes.has(c), `code ${c} drawn but not in a table`);
  for (const hex of svg.match(/#[0-9a-f]{3,6}\b/gi)) {
    const h = hex.slice(1).length === 3 ? hex.slice(1).replace(/./g, (d) => d + d) : hex.slice(1);
    assert.ok(h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6), `non-gray color ${hex}`);
  }
  const open = (svg.match(/<g[ >]/g) || []).length, close = (svg.match(/<\/g>/g) || []).length;
  assert.equal(open, close);
  assert.ok(!/NaN|undefined/.test(svg));
  for (const s of ['Plan view', 'Exploded view', 'Detail C · nested corner', 'Radius details', 'Shadow envelope', 'Detail B · body well']) assert.ok(svg.includes(s), s);
});

test('animate adds staggered fade-in and stays static otherwise', () => {
  assert.ok(!render({}).includes('animation'));
  const a = render({}, { animate: true });
  assert.ok(a.includes('@keyframes dd-in') && (a.match(/animation-delay/g) || []).length > 100);
});

test('example token files render', () => {
  for (const f of ['examples/card.json', 'examples/compact.json']) {
    const svg = render(JSON.parse(readFileSync(new URL('../' + f, import.meta.url), 'utf8')));
    assert.ok(svg.startsWith('<svg') && !/NaN/.test(svg), f);
  }
});
