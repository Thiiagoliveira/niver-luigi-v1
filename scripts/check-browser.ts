import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const url = process.env['APP_URL'] ?? 'http://localhost:4200';
const browser = await chromium.launch({ headless: true });
await mkdir('test-results', { recursive: true });
const failures: string[] = [];

async function scrollTo(page: Page, progress: number): Promise<void> {
  await page.evaluate(p => {
    const main = document.querySelector<HTMLElement>('.journey')!;
    const stage = document.querySelector<HTMLElement>('.stage')!;
    window.scrollTo({ top: p * (main.offsetHeight - stage.clientHeight), behavior: 'instant' });
  }, progress);
  await page.waitForFunction(p => Math.abs(Number(document.querySelector('.stage')?.getAttribute('data-progress')) - p) < 0.002, progress);
}

try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small-mobile', 320, 568]] as const) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600 });
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.actor');
    assert.equal(await page.locator('.stage').getAttribute('data-phase'), 'intro');
    assert.equal(await page.locator('.world-one .actor').getAttribute('data-frame'), '0');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `test-results/${name}-01-start.png` });

    if (width < 600) {
      const touch = await page.context().newCDPSession(page);
      const x = width / 2;
      const y = height * 0.72;
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 12; step++) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 20 }] });
        await page.waitForTimeout(16);
      }
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => Number(document.querySelector('.stage')?.getAttribute('data-progress')) > 0.01);
      await touch.detach();
    }

    // Real wheel input must advance both the position and the walking cycle.
    await scrollTo(page, 0.12);
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(45);
    const walkingFrame = Number(await page.locator('.world-one .actor').getAttribute('data-frame'));
    assert.ok(walkingFrame >= 1 && walkingFrame <= 6);
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.world-one .actor').getAttribute('data-frame'), '0');

    await scrollTo(page, 0.4325);
    const clip = await page.locator('.world-one .actor').evaluate(el => ({
      clip: Number(el.getAttribute('data-clip')), height: el.getBoundingClientRect().height,
      opacity: getComputedStyle(el).opacity, style: getComputedStyle(el).clipPath,
    }));
    assert.ok(clip.clip > 0 && clip.clip < clip.height, 'Entry must progressively clip, without opacity');
    assert.equal(clip.opacity, '1');
    assert.ok(clip.style.startsWith('inset'));
    await page.screenshot({ path: `test-results/${name}-02-pipe.png` });

    await scrollTo(page, 0.57);
    const traveling = await page.locator('.actor').evaluateAll(actors => actors.map(actor => ({
      clip: Number(actor.getAttribute('data-clip')), height: actor.getBoundingClientRect().height,
    })));
    assert.ok(traveling.every(a => a.clip >= a.height));
    await page.screenshot({ path: `test-results/${name}-03-transition.png` });

    await scrollTo(page, 0.7075);
    const exitClip = Number(await page.locator('.world-two .actor').getAttribute('data-clip'));
    assert.ok(exitClip > 0 && exitClip < clip.height);
    await page.screenshot({ path: `test-results/${name}-04-emerging.png` });
    await scrollTo(page, 1);
    assert.equal(await page.locator('.stage').getAttribute('data-phase'), 'party');
    assert.equal(await page.locator('.world-two .actor').getAttribute('data-frame'), '8');
    await page.screenshot({ path: `test-results/${name}-05-party.png` });

    await scrollTo(page, 0.88);
    assert.equal(await page.locator('.world-two .actor').getAttribute('data-direction'), '-1');
    await scrollTo(page, 0.4325);
    assert.equal(Number(await page.locator('.world-one .actor').getAttribute('data-clip')), clip.clip);
    await scrollTo(page, 0);
    assert.equal(await page.locator('.stage').getAttribute('data-camera'), '0');

    // Chapter shortcuts use the same scroll choreography.
    await page.getByRole('button', { name: /^(02 )?A festa$/ }).click();
    await page.waitForFunction(() => Number(document.querySelector('.stage')?.getAttribute('data-progress')) > 0.83);
    await page.getByRole('button', { name: 'Voltar ao início da aventura', exact: true }).click();
    await page.waitForFunction(() => Number(document.querySelector('.stage')?.getAttribute('data-progress')) < 0.001);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(`PASS ${name}: assets, walking, idle, occlusion, camera, emergence, reversal and chapter controls`);
    await page.close();
  }

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto(url);
  assert.equal(await reduced.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
  await scrollTo(reduced, 0.25);
  assert.equal(await reduced.locator('.world-one .mountains').evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)');
  await scrollTo(reduced, 1);
  assert.equal(await reduced.locator('.stage').getAttribute('data-phase'), 'party');
  console.log('PASS reduced motion: parallax disabled and complete adventure remains available');
  assert.deepEqual(failures, [], 'No JavaScript or asset loading errors');
} finally {
  await browser.close();
}
