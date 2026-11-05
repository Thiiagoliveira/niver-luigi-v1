export const STAGES = {
  walk: 0.035, approach: 0.30, onPipe: 0.365, sink: 0.395,
  hidden: 0.47, camera: 0.49, cameraEnd: 0.65,
  emerge: 0.67, emerged: 0.745, leave: 0.76, landed: 0.815,
  finish: 0.98,
} as const;

export type JourneyPhase = 'intro' | 'walking' | 'jumping' | 'entering' | 'traveling' | 'exiting' | 'party';
export interface ActorState {
  x: number;
  feet: number;
  clip: number;
  frame: number;
  walking: boolean;
}
export interface JourneyState {
  progress: number;
  camera: number;
  phase: JourneyPhase;
  first: ActorState;
  second: ActorState;
}
export interface SceneMetrics {
  width: number;
  height: number;
  ground: number;
  characterHeight: number;
  pipeHeight: number;
  pipeWidth: number;
  firstPipe: number;
  secondPipe: number;
}

export const clamp = (n: number, min = 0, max = 1): number => Math.min(max, Math.max(min, n));
export const range = (p: number, start: number, end: number): number => clamp((p - start) / (end - start));
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => t * t * (3 - 2 * t);

export function sceneMetrics(width: number, height: number): SceneMetrics {
  return {
    width, height, ground: height * 0.805,
    characterHeight: clamp(width * 0.14, 112, 152),
    pipeHeight: clamp(width * 0.098, 80, 112),
    pipeWidth: clamp(width * 0.105, 88, 124),
    firstPipe: width * 0.82,
    secondPipe: width * 0.18,
  };
}

/** Pure scroll choreography. No time, velocity or accumulated state: every pose is reversible. */
export function getJourney(progress: number, m: SceneMetrics): JourneyState {
  const p = clamp(progress);
  const s = STAGES;
  const rim = m.ground - m.pipeHeight + 14;
  const buried = rim + m.characterHeight + 20;
  const start = m.width * (m.width < 600 ? 0.18 : 0.105);
  const gap = m.pipeWidth / 2 + m.characterHeight * (80 / 272) + 8;
  const approach = m.firstPipe - gap;
  const landing = m.secondPipe + gap;
  const end = m.width * 0.86;
  const stride = Math.max(8, m.characterHeight * 0.075);
  const frameAt = (distance: number): number => 1 + Math.floor(Math.abs(distance) / stride) % 6;

  const walk1 = range(p, s.walk, s.approach);
  const jump1 = range(p, s.approach, s.onPipe);
  const sink = range(p, s.sink, s.hidden);
  const firstX = p < s.approach ? mix(start, approach, walk1) : mix(approach, m.firstPipe, jump1);
  const firstFeet = p < s.approach ? m.ground : p < s.onPipe
    ? mix(m.ground, rim, jump1) - Math.sin(jump1 * Math.PI) * m.pipeHeight * 0.65
    : mix(rim, buried, sink);
  const firstWalking = p > s.walk && p < s.approach;
  const first: ActorState = {
    x: firstX, feet: firstFeet,
    clip: p >= s.onPipe ? Math.max(0, firstFeet - rim) : 0,
    frame: firstWalking ? frameAt(firstX - start) : p >= s.sink ? 7 : 0,
    walking: firstWalking,
  };

  const emerge = range(p, s.emerge, s.emerged);
  const jump2 = range(p, s.leave, s.landed);
  const walk2 = range(p, s.landed, s.finish);
  const secondX = p < s.leave ? m.secondPipe : p < s.landed
    ? mix(m.secondPipe, landing, jump2) : mix(landing, end, walk2);
  const secondFeet = p < s.leave ? mix(buried, rim, emerge) : p < s.landed
    ? mix(rim, m.ground, jump2) - Math.sin(jump2 * Math.PI) * m.pipeHeight * 0.65 : m.ground;
  const secondWalking = p > s.landed && p < s.finish;
  const second: ActorState = {
    x: secondX, feet: secondFeet,
    clip: p <= s.leave ? Math.max(0, secondFeet - rim) : 0,
    frame: secondWalking ? frameAt(secondX - landing) : p >= s.finish ? 8 : p < s.emerged ? 7 : 0,
    walking: secondWalking,
  };

  const phase: JourneyPhase = p < s.walk ? 'intro' : p < s.approach ? 'walking'
    : p < s.onPipe ? 'jumping' : p < s.hidden ? 'entering'
    : p < s.emerge ? 'traveling' : p < s.leave ? 'exiting'
    : p < s.landed ? 'jumping' : p < s.finish ? 'walking' : 'party';
  return { progress: p, camera: smooth(range(p, s.camera, s.cameraEnd)) * m.height, phase, first, second };
}
