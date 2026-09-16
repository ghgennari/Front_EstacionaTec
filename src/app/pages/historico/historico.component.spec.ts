import { HistoricoComponent } from './historico.component';
import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, provideRouter } from '@angular/router';

describe('Histórico de permanências', () => {
  it('exibe o modelo e direciona ao cadastro do proprietário correto', async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoricoComponent],
      imports: [CommonModule, FormsModule, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(HistoricoComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[0].children[1].textContent).toContain('Civic');
    expect(rows[0].querySelector('a').getAttribute('href')).toBe(
      '/pessoas?proprietario=123.456.789-00',
    );
    expect(rows[2].querySelector('a')).toBeNull();
    expect(rows[2].textContent).toContain('Cadastro não vinculado');
  });
  it('exibe somente registros com saída, inclusive ao pesquisar', () => {
    const component = new HistoricoComponent();
    expect(component.filtered.map((record) => record.id)).toEqual([1, 3, 4]);
    component.search = 'Carlos';
    expect(component.filtered).toEqual([]);
    component.search = ' maria ';
    expect(component.filtered.map((record) => record.id)).toEqual([1]);
  });

  it('calcula a permanência a partir dos horários de entrada e saída', () => {
    const component = new HistoricoComponent();
    expect(component.duration(component.records[0])).toBe('4h 15min');
    expect(component.duration(component.records[2])).toBe('8h 25min');
  });

  it('considera a mudança de dia e permanências menores que uma hora', () => {
    const component = new HistoricoComponent();
    const record = {
      ...component.records[0],
      entry: '2026-08-15T23:50:00',
      exit: '2026-08-16T00:10:00',
    };
    expect(component.duration(record)).toBe('20min');
    record.exit = '2026-08-17T01:50:00';
    expect(component.duration(record)).toBe('26h 0min');
  });
});
