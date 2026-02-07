/**
 * Smoke test script for the Riyadh Demand Loop API.
 * Run with: npm run verify
 * Expects the dev server to be running on port 3000 (or PORT env var).
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  console.log(`\nVerifying API at ${BASE}...\n`);

  // Health
  console.log('GET /api/health');
  await test('returns ok', async () => {
    const { status, json } = await fetchJson('/api/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.ok === true, 'ok should be true');
    assert(json.db === true, 'db should be true');
    assert(typeof json.placesCount === 'number', 'placesCount should be number');
    assert(json.placesCount >= 5, `Expected at least 5 places, got ${json.placesCount}`);
  });

  // Places
  console.log('\nGET /api/places');
  await test('returns places array', async () => {
    const { status, json } = await fetchJson('/api/places');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(json.places), 'places should be array');
    assert(json.places.length >= 5, `Expected at least 5 places, got ${json.places.length}`);
  });

  await test('place object has correct shape', async () => {
    const { json } = await fetchJson('/api/places?limit=1');
    const p = json.places[0];
    assert(p.id, 'should have id');
    assert(p.nameAr, 'should have nameAr');
    assert(p.nameEn, 'should have nameEn');
    assert(['cafe', 'restaurant'].includes(p.category), `invalid category: ${p.category}`);
    assert(p.district, 'should have district');
    assert(typeof p.lat === 'number', 'lat should be number');
    assert(typeof p.lng === 'number', 'lng should be number');
    assert(typeof p.family === 'object', 'should have family');
    assert(typeof p.family.kids === 'boolean', 'family.kids should be boolean');
    assert(typeof p.family.stroller === 'boolean', 'family.stroller should be boolean');
    assert(typeof p.family.prayerRoom === 'boolean', 'family.prayerRoom should be boolean');
    assert(['easy', 'medium', 'hard'].includes(p.family.parkingEase), `invalid parkingEase: ${p.family.parkingEase}`);
    assert(typeof p.status === 'object', 'should have status');
    assert(typeof p.status.hoursKnown === 'boolean', 'status.hoursKnown should be boolean');
    assert(typeof p.demand === 'object', 'should have demand');
    assert(['low', 'medium', 'high'].includes(p.demand.crowdLevel), `invalid crowdLevel: ${p.demand.crowdLevel}`);
    assert(['0-10', '10-20', '20-40', '40+'].includes(p.demand.waitBand), `invalid waitBand: ${p.demand.waitBand}`);
    assert(['low', 'medium', 'high'].includes(p.demand.confidence), `invalid confidence: ${p.demand.confidence}`);
    assert(p.demand.lastUpdated, 'should have lastUpdated');
  });

  await test('category filter works', async () => {
    const { json } = await fetchJson('/api/places?category=cafe');
    for (const p of json.places) {
      assert(p.category === 'cafe', `Expected cafe, got ${p.category}`);
    }
  });

  await test('kids filter works', async () => {
    const { json: all } = await fetchJson('/api/places');
    const { json: filtered } = await fetchJson('/api/places?kids=true');
    for (const p of filtered.places) {
      assert(p.family.kids === true, 'Expected kids=true');
    }
  });

  await test('limit and offset work', async () => {
    const { json } = await fetchJson('/api/places?limit=2&offset=0');
    assert(json.places.length <= 2, `Expected max 2, got ${json.places.length}`);
  });

  // Trending
  console.log('\nGET /api/trending');
  await test('returns items with generatedAt', async () => {
    const { status, json } = await fetchJson('/api/trending');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.generatedAt, 'should have generatedAt');
    assert(Array.isArray(json.items), 'items should be array');
  });

  await test('items have rank', async () => {
    const { json } = await fetchJson('/api/trending?limit=5');
    if (json.items.length > 0) {
      assert(json.items[0].rank === 1, 'first rank should be 1');
      assert(json.items[0].place.id, 'should have place.id');
      assert(json.items[0].demand, 'should have demand');
    }
  });

  // Place detail
  console.log('\nGET /api/place/:id');
  let testPlaceId = null;
  await test('returns full place detail', async () => {
    const { json: list } = await fetchJson('/api/places?limit=1');
    testPlaceId = list.places[0].id;
    const { status, json } = await fetchJson(`/api/place/${testPlaceId}`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.place.id === testPlaceId, 'should match id');
    assert(json.now, 'should have now');
    assert(typeof json.now.confidenceScore === 'number', 'now.confidenceScore should be number');
    assert(Array.isArray(json.forecastNext6Hours), 'should have forecastNext6Hours');
    assert(json.forecastNext6Hours.length === 6, `Expected 6 forecast entries, got ${json.forecastNext6Hours.length}`);
    assert(Array.isArray(json.bestTimeWindows), 'should have bestTimeWindows');
    assert(Array.isArray(json.alternatives), 'should have alternatives');
  });

  await test('404 for nonexistent place', async () => {
    const { status, json } = await fetchJson('/api/place/nonexistent-id-xyz');
    assert(status === 404, `Expected 404, got ${status}`);
    assert(json.error.code === 'PLACE_NOT_FOUND', `Expected PLACE_NOT_FOUND, got ${json.error.code}`);
  });

  // Check-in
  console.log('\nPOST /api/checkin');
  await test('creates checkin successfully', async () => {
    const { status, json } = await fetchJson('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: testPlaceId,
        crowdLevel: 'high',
        waitBand: '20-40',
      }),
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(json.ok === true, 'ok should be true');
    assert(json.updated.placeId === testPlaceId, 'should match placeId');
    assert(json.updated.now.crowdLevel, 'should have crowdLevel');
    assert(json.updated.now.waitBand, 'should have waitBand');
    assert(json.updated.now.confidence, 'should have confidence');
    assert(typeof json.updated.now.confidenceScore === 'number', 'confidenceScore should be number');
  });

  await test('validates missing fields', async () => {
    const { status, json } = await fetchJson('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: testPlaceId }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(json.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${json.error.code}`);
  });

  await test('validates invalid crowdLevel', async () => {
    const { status, json } = await fetchJson('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: testPlaceId,
        crowdLevel: 'extreme',
        waitBand: '0-10',
      }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(json.error.code === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR`);
  });

  // Dev recompute
  console.log('\nPOST /api/dev/recompute');
  await test('recomputes all places', async () => {
    const { status, json } = await fetchJson('/api/dev/recompute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.ok === true, 'ok should be true');
    assert(typeof json.recomputed === 'number', 'recomputed should be number');
    assert(json.recomputed >= 5, `Expected at least 5 recomputed, got ${json.recomputed}`);
  });

  await test('recomputes specific places', async () => {
    const { status, json } = await fetchJson('/api/dev/recompute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeIds: [testPlaceId] }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(json.recomputed === 1, `Expected 1 recomputed, got ${json.recomputed}`);
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Verify script failed:', err);
  process.exit(1);
});
