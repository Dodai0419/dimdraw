---
name: dimdraw
description: Draw an Apple-style monochrome dimensional drawing (spec sheet, anatomy, redline) of a card UI component from its design tokens, written as one static SVG that renders in GitHub READMEs, docs and <img> tags. Use when the user asks for a dimensional drawing, spec sheet, anatomy or redline of a card, list item or panel, or wants the drawing to update when spacing/radius/shadow tokens change.
---

# dimdraw

Tokens in, one dimensional drawing out: plan view with chained dimensions, shadow envelope,
exploded layers, nested-corner detail, radius details, body-well detail and variable tables.
Node 18+, no packages, no browser.

## Commands (run from the repo root)
- Upstream's reference card: `node dimdraw.mjs -o card.svg`
- Your card: `node dimdraw.mjs my-card.json -o card.svg` (start from `examples/card.json`)
- Self-drawing version for a README: add `--animate`
- Tests: `node --test test/dimdraw.test.mjs`

## Workflow
1. Measure the real component (source file, computed styles). Fill a token JSON: `W` (reference
   width), `Wmin`/`Wmax`, `B` border, `S1..S6` spacing, `Z1` lead size, `H3` action height, `H4`
   trail height, `TH` title-slot height, `MH` meta-slot height, `TW` trail width, `AW` action width,
   `content` (heights of the body content slots), `R1` card radius, `R3` trail radius, shadow `Y`,
   `BL`, `SP`, `T1` touch minimum, plus `name`, `dwg`, `rev`, `date`, `source`.
2. Never invent values. If a token is unknown, ask or leave the default and say so.
3. Run the command. Derived values are computed: `H1 = 2·S1 + H3`, `R2 = R1 − B − S6`,
   `R4 = H3 ÷ 2`, `E1 = BL+SP−Y`, `E2 = BL+SP`, `E3 = BL+SP+Y`. Impossible tokens (negative R2,
   no room for the title slot) stop with an error naming the value.
4. Reply in one or two sentences: what was drawn and which values were assumed.
