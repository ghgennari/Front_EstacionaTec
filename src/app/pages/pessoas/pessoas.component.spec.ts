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
