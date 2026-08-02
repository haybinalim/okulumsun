import { test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { createRng } from '../../src/exercises/rng';
import { karsilastirGenerator, karsilastirUret } from '../../src/exercises/templates/karsilastir';
import { uretSay } from '../../src/exercises/templates/say';

test('dump2', () => {
  const out: string[] = [];
  const e1 = karsilastirUret({ seed: 7, difficulty: 2, soruTipi: 'esitMi', esit: true }, createRng(7));
  out.push('=== esitMi/esit ==='); out.push(JSON.stringify({ prompt: e1.prompt.ses, options: e1.options, validation: e1.validation, assets: e1.assets.map(a=>({id:a.id, adet:(a.gorsel as {adet?:number}).adet})) }, null, 1));
  const e2 = karsilastirUret({ seed: 9, difficulty: 2, soruTipi: 'esitMi', esit: false }, createRng(9));
  out.push('=== esitMi/farkli ==='); out.push(JSON.stringify({ prompt: e2.prompt.ses, options: e2.options, validation: e2.validation, assets: e2.assets.map(a=>({id:a.id, adet:(a.gorsel as {adet?:number}).adet})) }, null, 1));
  const e3 = karsilastirUret({ seed: 11, difficulty: 2, soruTipi: 'hangisiAz', secenekSayisi: 2 }, createRng(11));
  out.push('=== hangisiAz 2sik ==='); out.push(JSON.stringify({ prompt: e3.prompt.ses, options: e3.options, validation: e3.validation, assets: e3.assets.map(a=>({id:a.id, adet:(a.gorsel as {adet?:number}).adet})) }, null, 1));
  const s1 = uretSay({ seed: 5, difficulty: 4, responseMode: 'pickOnly' }, createRng(5));
  out.push('=== say pickOnly ==='); out.push(JSON.stringify({ kind: s1.kind, prompt: s1.prompt, options: s1.options, validation: s1.validation }, null, 1));
  const s2 = uretSay({ seed: 5, difficulty: 4, layout: 'onlukCerceve' }, createRng(5));
  out.push('=== say onlukCerceve ==='); out.push(JSON.stringify({ prompt: s2.prompt, validation: s2.validation }, null, 1));
  writeFileSync('/private/tmp/claude-501/-Users-alim-okulumsun/4bce4dc1-7b5d-47e3-83e9-e70dbb93a244/scratchpad/dump2.txt', out.join('\n'));
  void karsilastirGenerator;
});
