import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ParkingRegistryService } from './parking-registry.service';
import { create } from '../testing/api-test';
import { UsuariosComponent } from '../../pages/usuarios/usuarios.component';

describe('Pessoa e usuário vinculados', () => {
  it('atualiza cadastro compartilhado, proprietário e sessão pelo ID da pessoa', async () => {
    const current = { id: 1, personId: 30, name: 'Anterior', username: 'admin', email: 'antes@example.test',
      document: '12345678909', phone: '11987654321', role: 'Administrador', status: 'Ativo' };
    sessionStorage.setItem('estacionatec-user', JSON.stringify(current));
    sessionStorage.setItem('estacionatec-token', 'teste');
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const api=TestBed.inject(ParkingRegistryService), http=TestBed.inject(HttpTestingController);
    const person={ id:30, name:current.name, email:current.email, document:current.document, phone:current.phone, type:'Professor', active:true };
    const loading=api.loadRegistry();
    http.expectOne('/api/pessoas').flush([person, {...person,id:31}]);
    http.expectOne('/api/veiculos').flush([{id:7,ownerId:30,owner:person.name,category:'Professor',plate:'ABC-1234'}]);
    await loading;
    api.syncUser({...current,name:'Pelo Usuario',document:'79126483015',phone:'1134567890',email:'novo@example.test'});
    expect(api.people.find(p=>p.id===30)?.phone).toBe('1134567890');
    expect(api.people.find(p=>p.id===31)?.phone).toBe(person.phone);
    expect(api.vehicles[0].owner).toBe('Pelo Usuario');
    api.syncPerson({...person,name:'Pela Pessoa',document:'79126483016',phone:'11999998888',email:'pessoa@example.test'});
    expect(api.user()?.name).toBe('Pela Pessoa');
    expect(api.user()?.document).toBe('79126483016');
    expect(api.user()?.phone).toBe('11999998888');
    expect(api.user()?.email).toBe('pessoa@example.test');
    expect(JSON.parse(sessionStorage.getItem('estacionatec-user')!).phone).toBe('11999998888');
    http.verify();
  });

  it('avisa quando uma API antiga ignora os novos campos em vez de mostrar sucesso', async () => {
    const {component,http}=create(UsuariosComponent);
    component.openCreate();
    component.form={name:'Pessoa',username:'pessoa',email:'pessoa@example.test',document:'79126483015',phone:'11987654321',role:'Porteiro',status:'Ativo',password:'Senha123!'};
    const pending=component.save();
    http.expectOne('/api/usuarios').flush({id:20,name:'Pessoa',username:'pessoa',email:'pessoa@example.test',role:'Porteiro',status:'Ativo'});
    await pending;
    expect(component.modal).toBe(true);
    expect(component.error).toContain('Atualize o back-end');
    http.verify();
  });
});
