import { Component } from '@angular/core';
@Component({
  selector: 'app-relatorios',
  standalone: false,
  templateUrl: './relatorios.component.html',
})
export class RelatoriosComponent {
  start = '';
  end = '';
  type = 'Entradas e Saídas';
  readonly recentReports = [
    { name: 'Relatório Diário - 05/05/2026', date: '05/05/2026 18:00', size: '245 KB' },
    { name: 'Relatório Semanal - Semana 18', date: '04/05/2026 23:59', size: '1.2 MB' },
    { name: 'Relatório Mensal - Abril 2026', date: '01/05/2026 00:00', size: '3.5 MB' },
  ];
  message = '';
  generate() {
    this.message =
      !this.start || !this.end || this.start > this.end
        ? 'Informe um período válido para o relatório.'
        : 'A geração de relatórios estará disponível após a integração com o servidor.';
  }
  download(): void {
    this.message = 'Este relatório é demonstrativo; o arquivo PDF ainda não está disponível.';
  }
}
