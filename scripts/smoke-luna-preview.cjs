const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'server-only') return {};
  if (request.startsWith('@/')) request = path.join(process.cwd(), request.slice(2));
  return originalLoad.call(this, request, ...args);
};

const { generateSocialBatch } = require('../lib/d2d-platform/openai.ts');
const { prepareCreative, estimateCreative, generateCreative } = require('../lib/social-ai/generate.ts');
const { marketingPlanContentSchema } = require('../lib/d2d-platform/schemas.ts');

async function run() {
  assert(process.env.OPENAI_API_KEY, 'Preview OpenAI credential is missing');
  delete process.env.OPENAI_SOCIAL_MODEL;
  const actualFetch = global.fetch;
  const observed = [];
  global.fetch = async (url, init) => {
    const endpoint = new URL(url).pathname;
    const request = JSON.parse(init.body);
    if (endpoint.startsWith('/v1/responses')) assert.equal(request.model, 'gpt-6-luna');
    const response = await actualFetch(url, init);
    observed.push([endpoint, response.status]);
    if (!response.ok) {
      const body = await response.clone().json().catch(() => ({}));
      const safe = Object.fromEntries(['type', 'code', 'param'].map(k => [k, typeof body.error?.[k] === 'string' && /^[a-z0-9_.\\[\\]-]{1,100}$/i.test(body.error[k]) ? body.error[k] : null]));
      console.error('D2D_LUNA_SMOKE API failure', endpoint, response.status, JSON.stringify(safe));
    }
    return response;
  };

  const plan = marketingPlanContentSchema.parse({
    executiveSummary: 'A free beginner watercolor workshop at fictional Cedar Studio on November 20. No other offers are approved.',
    goals: ['Invite adults to reserve a workshop seat'],
    audiences: ['Adults new to watercolor'],
    positioning: 'Beginner-friendly neighborhood art studio',
    voice: ['Calm, concise, plain English'],
    contentPillars: [{ name: 'Watercolor workshop', purpose: 'Invite beginners', frequency: 'Once' }],
    channels: [{ platform: 'Instagram', cadence: 'Once', purpose: 'Share the workshop' }],
    seasonalPriorities: [],
    measures: ['Seat reservations'],
    responsibilities: [{ owner: 'Studio team', responsibility: 'Manage reservations' }],
  });

  const verifyCopy = (captions) => {
    for (const caption of Object.values(captions)) {
      assert.match(caption, /watercolo[u]?r/i);
      assert.doesNotMatch(caption, /\$\s*\d|\b\d+\s*%|https?:|\bguaranteed\b|already (?:approved|published|scheduled)/i);
    }
  };

  const batch = await generateSocialBatch({
    organizationName: 'Cedar Studio',
    periodStart: '2026-11-20',
    periodEnd: '2026-11-20',
    plan,
    promotions: [],
    instructions: 'Generate exactly one item for November 20, 2026 at 9 AM UTC. Each caption must mention watercolor. Use no URLs or dollar amounts.',
  });
  assert.equal(batch.items.length, 1);
  assert.equal(new Date(batch.items[0].scheduledFor).toISOString().slice(0, 10), '2026-11-20');
  verifyCopy(batch.items[0].captions);
  console.log('D2D_LUNA_SMOKE batch PASS: real model response, application schema, schedule and grounded captions');

  const pdf = await PDFDocument.create();
  pdf.addPage().drawText('Cedar Studio brand guide: Use a calm voice and a forest-green accent. Never invent prices or booking links.', { x: 30, y: 720, size: 11 });
  const logo = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#284630' } }).png().toBuffer();
  const payload = await prepareCreative({
    name: 'Cedar Studio',
    logo,
    primaryColor: '#284630',
    accentColor: '#EBE9DF',
    guidelines: [{ title: 'Voice', content: 'Calm and concise. Never invent offers or URLs.' }],
    pdfs: [{ name: 'Cedar Studio brand guide.pdf', data: Buffer.from(await pdf.save()) }],
  }, 'Invite beginners to the free watercolor workshop. Mention watercolor in each caption. Use no links or prices.', plan);
  assert(payload.input[0].content.some(item => item.type === 'input_image'));
  assert(payload.input[0].content.some(item => item.type === 'input_file'));
  const estimate = await estimateCreative(payload);
  assert(estimate.copyInput > 0);
  console.log('D2D_LUNA_SMOKE token estimate PASS: accepted a logo and brand PDF, returned ' + estimate.copyInput + ' input tokens');

  const usage = [];
  const { creative, background } = await generateCreative(payload, async (stage) => usage.push(stage));
  verifyCopy(creative.captions);
  assert.equal(creative.scenes.length, 4);
  assert.equal(usage[0]?.model, 'gpt-6-luna');
  assert.equal(usage[1]?.stage, 'image');
  assert((await sharp(background).metadata()).width > 0);
  assert.deepEqual(observed.map(([endpoint]) => endpoint), ['/v1/responses', '/v1/responses/input_tokens', '/v1/responses', '/v1/images/generations']);
  console.log('D2D_LUNA_SMOKE single draft PASS: real model response, application schema, grounded captions and image generation');
}
run().catch(error => {
  console.error('D2D_LUNA_SMOKE failed:', error.message);
  process.exitCode = 1;
});
