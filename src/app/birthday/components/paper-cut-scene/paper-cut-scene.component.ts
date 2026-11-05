import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-paper-cut-scene', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paper-cut-scene.component.html',
  styleUrl: './paper-cut-scene.component.scss',
  host: { '[class.party]': 'party' },
})
export class PaperCutSceneComponent {
  @Input() party = false;
  @Input() progress = 0;
  @Input() reducedMotion = false;

  layer(speed: number): string {
    return `translate3d(${this.reducedMotion ? 0 : -this.progress * speed}px, 0, 0)`;
  }
}
