import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getJourney, sceneMetrics, STAGES } from './journey';

for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [1920, 1080]]) {
  const m = sceneMetrics(width, height);
  test(`${width}x${height}: camera moves only while both characters are fully inside pipes`, () => {
    for (let p = STAGES.camera; p <= STAGES.cameraEnd; p += 0.001) {
      const state = getJourney(p, m);
      assert.ok(state.first.clip >= m.characterHeight);
      assert.ok(state.second.clip >= m.characterHeight);
    }
    assert.equal(getJourney(STAGES.camera, m).camera, 0);
    assert.equal(getJourney(STAGES.cameraEnd, m).camera, height);
  });
  test(`${width}x${height}: position and clipping remain continuous at every boundary`, () => {
    for (const boundary of Object.values(STAGES)) {
      const before = getJourney(boundary - 0.000001, m);
      const after = getJourney(boundary + 0.000001, m);
      for (const key of ['first', 'second'] as const) {
        assert.ok(Math.abs(before[key].x - after[key].x) < 0.1);
        assert.ok(Math.abs(before[key].feet - after[key].feet) < 0.1);
        assert.ok(Math.abs(before[key].clip - after[key].clip) < 0.1);
      }
      assert.ok(Math.abs(before.camera - after.camera) < 0.1);
    }
  });
  test(`${width}x${height}: entry and exit are gradual, and exactly reversible`, () => {
    const states = Array.from({ length: 1001 }, (_, i) => getJourney(i / 1000, m));
    for (let i = 1000; i >= 0; i--) assert.deepEqual(getJourney(i / 1000, m), states[i]);
    const halfwayIn = getJourney((STAGES.sink + STAGES.hidden) / 2, m);
    const halfwayOut = getJourney((STAGES.emerge + STAGES.emerged) / 2, m);
    assert.ok(halfwayIn.first.clip > 0 && halfwayIn.first.clip < m.characterHeight);
    assert.ok(halfwayOut.second.clip > 0 && halfwayOut.second.clip < m.characterHeight);
    assert.equal(getJourney(STAGES.onPipe, m).first.x, m.firstPipe);
    assert.equal(getJourney(STAGES.emerged, m).second.x, m.secondPipe);
    assert.equal(getJourney(0, m).first.feet, m.ground);
    assert.equal(getJourney(1, m).second.feet, m.ground);
  });
}
test('clamps browser overscroll to the beginning and end', () => {
  const m = sceneMetrics(1440, 900);
  assert.deepEqual(getJourney(-0.2, m), getJourney(0, m));
  assert.deepEqual(getJourney(1.2, m), getJourney(1, m));
});
