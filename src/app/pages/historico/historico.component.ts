import { Component } from '@angular/core';

interface HistoryRecord {
  id: number;
  plate: string;
  owner: string;
  ownerDocument: string | null;
  model: string | null;
  entry: string;
  exit: string | null;
}

@Component({
  selector: 'app-historico',
  standalone: false,
  templateUrl: './historico.component.html',
})
export class HistoricoComponent {
  search = '';
  records: HistoryRecord[] = [
    {
      id: 1,
      plate: 'ABC-1234',
      owner: 'Maria Silva',
      ownerDocument: '123.456.789-00',
      model: 'Civic',
      entry: '2026-08-16T08:30:00',
      exit: '2026-08-16T12:45:00',
    },
    {
      id: 2,
      plate: 'XYZ-5678',
      owner: 'Carlos Santos',
      ownerDocument: '987.654.321-00',
      model: 'Corolla',
      entry: '2026-08-16T07:15:00',
      exit: null,
    },
    {
      id: 3,
      plate: 'DEF-9012',
      owner: 'Ana Paula',
      ownerDocument: '456.789.123-00',
      model: 'CG 160',
      entry: '2026-08-15T09:45:00',
      exit: '2026-08-15T18:10:00',
    },
    {
      id: 4,
      plate: 'GHI-3456',
      owner: 'Roberto Lima',
      ownerDocument: null,
      model: null,
      entry: '2026-08-15T10:20:00',
      exit: '2026-08-15T14:30:00',
    },
  ];
  get filtered() {
    return this.records.filter(
      (r) =>
        !!r.exit &&
        [r.plate, r.owner].join(' ').toLowerCase().includes(this.search.trim().toLowerCase()),
    );
  }

  duration(record: HistoryRecord): string {
    if (!record.exit) return '—';
    const elapsed = new Date(record.exit).getTime() - new Date(record.entry).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0) return 'Horários inválidos';
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}min` : `${minutes}min`;
  }
}
