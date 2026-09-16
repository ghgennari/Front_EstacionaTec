import { Component } from '@angular/core';
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  stats = [
    ['Veículos Estacionados', '5'],
    ['Entradas Hoje', '9'],
    ['Saídas Hoje', '4'],
  ];
  vehicles = [
    ['ABC-1234', 'Maria Silva', 'Aluno', '08:30'],
    ['XYZ-5678', 'Prof. Carlos Santos', 'Professor', '07:15'],
    ['DEF-9012', 'Ana Paula', 'Funcionário', '09:45'],
    ['GHI-3456', 'Roberto Lima', 'Aluno', '10:20'],
    ['JKL-7890', 'Prof. Fernanda Costa', 'Professor', '08:00'],
  ];
}
