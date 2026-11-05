import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild, signal } from '@angular/core';
import { GreenPipeComponent } from './components/green-pipe/green-pipe.component';
import { LuigiCharacterComponent } from './components/luigi-character/luigi-character.component';
import { PaperCutSceneComponent } from './components/paper-cut-scene/paper-cut-scene.component';
import { getJourney, sceneMetrics } from './journey';

@Component({
  selector: 'app-birthday-page', standalone: true,
  imports: [GreenPipeComponent, LuigiCharacterComponent, PaperCutSceneComponent],
  templateUrl: './birthday-page.component.html',
  styleUrl: './birthday-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BirthdayPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('journey') private journeyElement!: ElementRef<HTMLElement>;
  @ViewChild('stage') private stageElement!: ElementRef<HTMLElement>;

  readonly metrics = signal(sceneMetrics(window.innerWidth, window.innerHeight));
  readonly state = signal(getJourney(0, this.metrics()));
  readonly moving = signal(false);
  readonly direction = signal(1);
  readonly reducedMotion = signal(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  readonly phaseLabels = {
    intro: 'Uma aventura especial está começando...', walking: 'Um passinho de cada vez.',
    jumping: 'Vamos para a próxima fase!', entering: 'Um atalho para a diversão.',
    traveling: 'A festa está logo ali embaixo.', exiting: 'Olá, mundo da festa!', party: 'A melhor aventura é celebrar com você.',
  };
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private observer?: ResizeObserver;
  private raf = 0;
  private lastScroll = 0;
  private previousY = window.scrollY;
  private start = 0;
  private distance = 1;
  private destroyed = false;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.measure();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.measure, { passive: true });
      window.addEventListener('pageshow', this.measure);
      this.motionPreference.addEventListener('change', this.onMotionPreference);
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(this.stageElement.nativeElement);
      this.queueFrame();
    });
  }

  private readonly measure = (): void => {
    if (this.destroyed) return;
    const stage = this.stageElement.nativeElement;
    const journey = this.journeyElement.nativeElement;
    this.start = journey.getBoundingClientRect().top + window.scrollY;
    this.distance = Math.max(1, journey.offsetHeight - stage.clientHeight);
    this.zone.run(() => this.metrics.set(sceneMetrics(stage.clientWidth, stage.clientHeight)));
    this.queueFrame();
  };

  private readonly onScroll = (): void => {
    const y = window.scrollY;
    if (Math.abs(y - this.previousY) > 0.25) {
      const direction = y > this.previousY ? 1 : -1;
      this.zone.run(() => this.direction.set(direction));
      this.lastScroll = performance.now();
    }
    this.previousY = y;
    this.queueFrame();
  };

  private readonly onMotionPreference = (event: MediaQueryListEvent): void => {
    this.zone.run(() => this.reducedMotion.set(event.matches));
  };

  private queueFrame(): void {
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(this.update);
  }

  private readonly update = (now: number): void => {
    this.raf = 0;
    const progress = (window.scrollY - this.start) / this.distance;
    const moving = now - this.lastScroll < 140 && this.lastScroll > 0;
    this.zone.run(() => {
      this.state.set(getJourney(progress, this.metrics()));
      this.moving.set(moving);
    });
    // Continue only until the idle pose is restored. Time never advances the journey.
    if (moving) this.queueFrame();
  };

  goTo(progress: number): void {
    window.scrollTo({ top: this.start + progress * this.distance, behavior: this.reducedMotion() ? 'instant' : 'smooth' });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.measure);
    window.removeEventListener('pageshow', this.measure);
    this.motionPreference.removeEventListener('change', this.onMotionPreference);
  }
}
