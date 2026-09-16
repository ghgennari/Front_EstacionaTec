import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ParkingRegistryService } from '../../core/services/parking-registry.service';
import { PessoasComponent } from './pessoas.component';

describe('Ações de pessoas', () => {
  function create() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.runInInjectionContext(() => new PessoasComponent());
  }

  it('abre os dados do proprietário pelo documento recebido do histórico', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ proprietario: '123.456.789-00' })),
          },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PessoasComponent());
    component.ngOnInit();
    expect(component.selectedOwner?.name).toBe('Maria Silva');
    expect(component.selectedOwner?.email).toBe('maria@edu.br');
    expect(component.modal).toBe(false);
  });

  it('não abre outra pessoa quando o cadastro não existe mais', () => {
    const component = create();
    component.ownerDocument = 'inexistente';
    expect(component.selectedOwner).toBeUndefined();
  });

  it('edita a pessoa e mantém o vínculo dos veículos', () => {
    const component = create();
    component.edit(component.people[0]);
    component.form.name = 'Maria Atualizada';
    component.form.type = 'Professor';
    component.save();
    expect(component.people.length).toBe(3);
    const entry = TestBed.inject(ParkingRegistryService).registerEntry('ABC1234');
    expect(entry.owner).toBe('Maria Atualizada');
    expect(entry.category).toBe('Professor');
  });

  it('cancelar descarta alterações', () => {
    const component = create();
    component.edit(component.people[0]);
    component.form.name = 'Alteração';
    component.closeModal();
    expect(component.people[0].name).toBe('Maria Silva');
  });

  it('bloqueia exclusão de proprietário com veículos', () => {
    const component = create();
    component.requestDelete(component.people[0]);
    component.confirmDelete();
    expect(component.people.length).toBe(3);
    expect(component.deleteError).toContain('veículos vinculados');
  });

  it('exclui pessoa sem veículos somente na confirmação', () => {
    const component = create();
    component.form = { name: 'Nova Pessoa', document: '999', email: '', phone: '', type: 'Aluno' };
    component.save();
    component.requestDelete(component.people[3]);
    expect(component.people.length).toBe(4);
    component.confirmDelete();
    expect(component.people.length).toBe(3);
  });

  it('não permite documento duplicado na edição', () => {
    const component = create();
    component.edit(component.people[0]);
    component.form.document = component.people[1].document;
    component.save();
    expect(component.error).toContain('Já existe');
    expect(component.people[0].document).toBe('123.456.789-00');
  });
});
