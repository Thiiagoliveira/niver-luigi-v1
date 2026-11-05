import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-green-pipe', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pipe-back" [style]="geometry"><div class="opening"></div></div>
    <div class="pipe-front" [style]="geometry"><div class="body"></div><div class="lip"><i></i></div></div>`,
  styleUrl: './green-pipe.component.scss',
})
export class GreenPipeComponent {
  @Input() x = 0;
  @Input() ground = 0;
  @Input() width = 124;
  @Input() height = 112;

  get geometry(): string {
    return `left:${this.x - this.width / 2}px;top:${this.ground - this.height}px;width:${this.width}px;height:${this.height}px`;
  }
}
