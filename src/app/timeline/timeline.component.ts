import { Component, Input } from '@angular/core';

export interface TimelineEtapa {
  etapa: string;
  mes: number;
  data: Date;
  fase: 'Obras' | 'Amortizacao';
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent {
  @Input() etapas: TimelineEtapa[] = [];
}
