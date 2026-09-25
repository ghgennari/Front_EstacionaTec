import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  ParkingRegistryService,
  CapturedImage,
} from '../../core/services/parking-registry.service';

@Component({
  selector: 'app-imagens',
  standalone: false,
  templateUrl: './imagens.component.html',
  styleUrl: './imagens.component.css',
})
export class ImagensComponent implements OnInit, OnDestroy {
  private readonly api = inject(ParkingRegistryService);
  private readonly cdr = inject(ChangeDetectorRef);
  previewUrl = '';
  async ngOnInit(): Promise<void> {
    try {
      this.images = await this.api.request<CapturedImage[]>('GET', '/imagens');
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  async select(image: CapturedImage): Promise<void> {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.selectedImage = image;
    this.previewUrl = '';
    this.message = '';
    if (!image.available) {
      this.message = 'Registro importado do protótipo, sem arquivo real.';
      return;
    }
    try {
      this.previewUrl = URL.createObjectURL(
        await this.api.blob('/imagens/' + image.id + '/arquivo'),
      );
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
  ngOnDestroy(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
  }

  searchPlate = '';
  dateFilter = '';
  accessType = '';
  accessStatus = '';
  selectedImage: CapturedImage | null = null;
  message = '';
  page = 1;
  readonly pageSize = 10;
  images: CapturedImage[] = [];

  get filtered(): CapturedImage[] {
    return this.images.filter(
      (image) =>
        (image.plate ?? '').toLowerCase().includes(this.searchPlate.trim().toLowerCase()) &&
        (!this.dateFilter || image.date === this.dateFilter) &&
        (!this.accessType || image.type === this.accessType) &&
        (!this.accessStatus || image.status === this.accessStatus),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get visibleImages(): CapturedImage[] {
    return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }
  resetPage(): void {
    this.page = 1;
  }
  changePage(offset: number): void {
    this.page = Math.min(this.totalPages, Math.max(1, this.page + offset));
  }
  dateTime(image: CapturedImage): string {
    return `${image.date.split('-').reverse().join('/')} ${image.time}`;
  }
  async download(image: CapturedImage): Promise<void> {
    if (!image.available) {
      this.message = 'Este registro demonstrativo não possui arquivo.';
      return;
    }
    try {
      await this.api.download('/imagens/' + image.id + '/arquivo', image.fileName);
    } catch (error) {
      this.message = this.api.error(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
}
