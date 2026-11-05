import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActorState } from '../../journey';

@Component({
  selector: 'app-luigi-character',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="actor" [style.width.px]="height * 160 / 272" [style.height.px]="height"
      [style.transform]="position" [style.clip-path]="'inset(0 0 ' + pose.clip + 'px 0)'"
      [attr.data-frame]="frame" [attr.data-clip]="pose.clip" [attr.data-direction]="direction" role="img" aria-label="Luigi">
      <div class="sprite" [style.background-position-x.%]="frame * 100 / 8"
        [style.transform]="'scaleX(' + (frame === 7 || frame === 8 ? 1 : -direction) + ')'">
      </div>
    </div>`,
  styles: `
    :host { position: absolute; inset: 0; z-index: 40; pointer-events: none; }
    .actor { position: absolute; left: 0; top: 0; will-change: transform, clip-path; }
    .sprite { width: 100%; height: 100%; background: url('/assets/luigi/luigi-atlas.png') no-repeat;
      background-size: 900% 100%; filter: drop-shadow(2px 3px 1px #24452a2b); }
  `,
})
export class LuigiCharacterComponent {
  @Input({ required: true }) pose!: ActorState;
  @Input() height = 152;
  @Input() direction = 1;
  @Input() moving = false;

  get frame(): number { return this.pose.walking && !this.moving ? 0 : this.pose.frame; }
  get position(): string {
    return `translate3d(${this.pose.x - this.height * 80 / 272}px, ${this.pose.feet - this.height}px, 0)`;
  }
}
