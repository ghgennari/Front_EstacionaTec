import { create, person, vehicle } from '../../core/testing/api-test';
import { PessoasComponent } from './pessoas.component';
describe('Pessoas integradas', () => {
  it('carrega o cadastro e mantém o formulário aberto quando o servidor rejeita', async () => {
    const { component, http } = create(PessoasComponent);
    const load = component.ngOnInit();
    http.expectOne('/api/pessoas').flush([person]);
    http.expectOne('/api/veiculos').flush([vehicle]);
    await load;
    component.ownerDocument = '123';
    expect(component.selectedOwner?.id).toBe(1);
    component.edit(component.people[0]);
    component.form.document = 'duplicado';
    const pending = component.save();
    http
      .expectOne('/api/pessoas/1')
      .flush({ message: 'Documento duplicado' }, { status: 409, statusText: 'Conflict' });
    await pending;
    expect(component.modal).toBe(true);
    expect(component.people[0].document).toBe('123');
    http.verify();
  });
  it('mostra o bloqueio de exclusão por vínculo sem apagar localmente', async () => {
    const { component, http } = create(PessoasComponent);
    component.requestDelete(person);
    const pending = component.confirmDelete();
    http
      .expectOne('/api/pessoas/1')
      .flush(
        { message: 'Pessoa possui veículos vinculados.' },
        { status: 409, statusText: 'Conflict' },
      );
    await pending;
    expect(component.pendingDelete).toEqual(person);
    expect(component.deleteError).toContain('vinculados');
    http.verify();
  });
});

describe('Pessoas sem máscara na API', () => {
  it('normaliza a busca, o vínculo por CPF e o envio para salvar', async () => {
    const { component, fixture, http } = create(PessoasComponent);
    fixture.detectChanges();
    http.expectOne('/api/pessoas').flush([{ ...person, document: '12345678909', phone: '11987652143' }]);
    http.expectOne('/api/veiculos').flush([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    component.ownerDocument = '123.456.789-09';
    expect(component.selectedOwner?.id).toBe(person.id);
    for (const query of ['123.456.789-09', '(11) 98765-2143', '11987652143']) {
      component.search = query;
      expect(component.filtered.length).toBe(1);
    }
    component.edit(component.people[0]);
    component.form.document = '123.456.789-09';
    component.form.phone = '(11) 98765-2143';
    const saving = component.save();
    const request = http.expectOne('/api/pessoas/1');
    expect(request.request.body.document).toBe('12345678909');
    expect(request.request.body.phone).toBe('11987652143');
    request.flush(person);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('/api/pessoas').flush([person]);
    http.expectOne('/api/veiculos').flush([]);
    await saving;
    http.verify();
  });
});
