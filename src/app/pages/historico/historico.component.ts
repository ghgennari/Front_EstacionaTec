import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import {
  ParkingRegistryService,
  HistoryRecord,
  RegisteredPerson,
} from '../../core/services/parking-registry.service';
@Component({
  selector: 'app-historico',
  standalone: false,
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.css',
})
export class HistoricoComponent implements OnInit, OnDestroy {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  canViewContact(): boolean { return this.api.isAdmin(); }
  search = '';
  error = '';
  records: HistoryRecord[] = [];
  selectedRecord: HistoryRecord | null = null;
  owner: RegisteredPerson | null = null;
  ownerLoading = false;
  ownerError = '';
  private ownerRequest = 0;
  @ViewChild('ownerDialog', { static: true }) private ownerDialog!: ElementRef<HTMLDialogElement>;

  async openOwner(record: HistoryRecord): Promise<void> {
    const request = ++this.ownerRequest;
    this.selectedRecord = record;
    this.owner = null;
    this.ownerError = '';
    this.ownerLoading = !!record.ownerDocument && this.api.isAdmin();
    this.ownerDialog.nativeElement.showModal();
    if (!record.ownerDocument || !this.api.isAdmin()) return;
    try {
      const people = await this.api.request<RegisteredPerson[]>('GET', '/pessoas');
      if (request !== this.ownerRequest) return;
      const document = record.ownerDocument.replace(/[^a-zA-Z0-9]/g, '');
      this.owner = people.find((person) =>
        person.document?.replace(/[^a-zA-Z0-9]/g, '') === document,
      ) ?? null;
    } catch (error) {
      if (request === this.ownerRequest) this.ownerError = this.api.error(error);
    } finally {
      if (request === this.ownerRequest) {
        this.ownerLoading = false;
        this.cdr.markForCheck();
      }
    }
  }

  closeOwner(event?: Event): void {
    event?.preventDefault();
    this.ownerRequest++;
    this.ownerDialog.nativeElement.close();
    this.selectedRecord = null;
    this.owner = null;
    this.ownerLoading = false;
    this.ownerError = '';
  }

  ngOnDestroy(): void {
    this.ownerRequest++;
  }
  get filtered() {
    return this.records.filter(
      (r) =>
        !!r.exit &&
        [r.plate, r.owner].join(' ').toLowerCase().includes(this.search.trim().toLowerCase()),
    );
  }
  async ngOnInit(): Promise<void> {
    try {
      this.records = await this.api.request<HistoryRecord[]>('GET', '/historico');
    } catch (error) {
      this.error = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  duration(record: HistoryRecord): string {
    if (!record.exit) return '—';
    const elapsed = new Date(record.exit).getTime() - new Date(record.entry).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0) return 'Horários inválidos';
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? hours + 'h ' + (minutes % 60) + 'min' : minutes + 'min';
  }
}
