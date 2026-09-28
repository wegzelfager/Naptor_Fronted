import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined, fallback: string = '0s'): string {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return fallback;
    }

    const totalSeconds = Math.max(0, Math.floor(seconds));
    if (totalSeconds === 0) {
      return fallback;
    }

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(days + 'd');
    }
    if (hours > 0) {
      parts.push(hours + 'h');
    }
    if (minutes > 0) {
      parts.push(minutes + 'm');
    }
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(remainingSeconds + 's');
    }

    return parts.join(' ');
  }
}
