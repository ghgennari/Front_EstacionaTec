import { Component } from '@angular/core';

interface CapturedImage {
  id: number;
  plate: string;
  owner: string;
  time: string;
  date: string;
  type: string;
  status: string;
  fileName: string;
  imagePath: string;
}

@Component({
  selector: 'app-imagens',
  standalone: false,
  templateUrl: './imagens.component.html',
  styleUrl: './imagens.component.css',
})
export class ImagensComponent {
  searchPlate = '';
  dateFilter = '';
  accessType = '';
  accessStatus = '';
  selectedImage: CapturedImage | null = null;
  message = '';
  page = 1;
  readonly pageSize = 10;
  readonly images: CapturedImage[] = [
    {
      id: 1,
      plate: 'XYZ-5678',
      owner: 'Prof. Carlos Santos',
      time: '14:32:15',
      type: 'Entrada',
      status: 'Autorizado',
      fileName: 'XYZ-5678_143215.jpg',
    },
    {
      id: 2,
      plate: 'XXX-0000',
      owner: 'Desconhecido',
      time: '14:28:43',
      type: 'Entrada',
      status: 'Negado',
      fileName: 'XXX-0000_142843.jpg',
    },
    {
      id: 3,
      plate: 'ABC-1234',
      owner: 'Maria Silva',
      time: '12:45:10',
      type: 'Saída',
      status: 'Autorizado',
      fileName: 'ABC-1234_124510.jpg',
    },
    {
      id: 4,
      plate: 'DEF-9012',
      owner: 'Ana Paula',
      time: '09:15:30',
      type: 'Entrada',
      status: 'Autorizado',
      fileName: 'DEF-9012_091530.jpg',
    },
  ].map((image) => ({
    ...image,
    date: '2026-05-07',
    imagePath: `/captures/2026-05-07/${image.fileName}`,
  }));

  get filtered(): CapturedImage[] {
    return this.images.filter(
      (image) =>
        image.plate.toLowerCase().includes(this.searchPlate.trim().toLowerCase()) &&
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
  download(image: CapturedImage): void {
    this.message = `O arquivo ${image.fileName} é demonstrativo e não está disponível para download.`;
  }
}
