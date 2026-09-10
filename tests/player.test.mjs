import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coverage,
  replaceAngle,
  locateMoment,
  exchangeEstimate,
  validateManualEntries,
} from '../lib/player-model.mjs';

test('late and early camera coverage never supplies a stale endpoint', () => {
  const camera = { id: 'b', offset: 3, duration: 5 };
  assert.equal(coverage(camera, 2.999), false);
  assert.equal(coverage(camera, 3), true);
  assert.equal(coverage(camera, 8), false);
  assert.equal(coverage({ ...camera, offset: -2 }, 0), true);
});
test('changing angle preserves event time and rejects partial coverage', () => {
  const m = {
    id: 'm',
    clipId: 'a',
    start: 4,
    duration: 3,
    offset: 2,
    title: 'Jump',
  };
  const replacement = replaceAngle(m, { id: 'b', offset: 5, duration: 10 });
  assert.equal(replacement.start, 1);
  assert.equal(replacement.start + replacement.offset, m.start + m.offset);
  assert.equal(replaceAngle(m, { id: 'c', offset: 7, duration: 10 }), null);
  assert.equal(replaceAngle(m, { id: 'c', offset: 5, duration: 2 }), null);
});
test('preview respects editorial order rather than original event order', () => {
  const moments = [
    { clipId: 'b', start: 10, duration: 2 },
    { clipId: 'a', start: 1, duration: 3 },
  ];
  assert.deepEqual(locateMoment(moments, 2), { index: 1, sourceTime: 1 });
  assert.deepEqual(locateMoment(moments, 4), { index: 1, sourceTime: 3 });
  assert.equal(locateMoment(moments, 5), null);
});
test('four-timestamp estimate excludes server processing time', () => {
  const result = exchangeEstimate(1000, 1030, 1070, 1080);
  assert.equal(result.offset, 10);
  assert.equal(result.roundTrip, 40);
  assert.equal(result.error, 20);
  assert.throws(() => exchangeEstimate(100, 90, 80, 110), /Invalid/);
});
test('asymmetric network delay remains bias despite unique marker identity', () => {
  // True offset 0; outward delay 10, return delay 90.
  assert.equal(exchangeEstimate(0, 10, 10, 100).offset, -40);
});
test('manual rendering validates source membership and preserves exact ordered ranges', () => {
  const clips = [
    { id: 'a', duration: 20, startTime: 0 },
    { id: 'b', duration: 8, startTime: 0 },
  ];
  const entries = [
    { clipId: 'b', start: 2, duration: 2 },
    { clipId: 'a', start: 7, duration: 3 },
  ];
  const plan = validateManualEntries(clips, entries);
  assert.equal(plan.duration, 5);
  assert.deepEqual(
    plan.entries.map((e) => e.clipId),
    ['b', 'a'],
  );
  assert.equal(plan.entries[1].start, 7);
  for (const invalid of [
    [{ clipId: 'foreign', start: 0, duration: 2 }],
    [{ clipId: 'a', start: 19, duration: 2 }],
    [{ clipId: 'a', start: NaN, duration: 2 }],
    [],
    [{ clipId: 'a', start: 0, duration: 0.1 }],
  ])
    assert.throws(() => validateManualEntries(clips, invalid));
  assert.throws(
    () =>
      validateManualEntries(
        clips,
        Array.from({ length: 7 }, () => ({
          clipId: 'a',
          start: 0,
          duration: 20,
        })),
      ),
    /120/,
  );
});
