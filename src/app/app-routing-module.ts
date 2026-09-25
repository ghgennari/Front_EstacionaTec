import { authGuard, adminGuard } from './core/auth.guard';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MonitoramentoComponent } from './pages/monitoramento/monitoramento.component';
import { ImagensComponent } from './pages/imagens/imagens.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RecuperarSenhaComponent } from './pages/auth/recuperar-senha/recuperar-senha.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EntradaComponent } from './pages/entrada/entrada.component';
import { HistoricoComponent } from './pages/historico/historico.component';
import { PessoasComponent } from './pages/pessoas/pessoas.component';
import { RelatoriosComponent } from './pages/relatorios/relatorios.component';
import { SaidaComponent } from './pages/saida/saida.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { VeiculosComponent } from './pages/veiculos/veiculos.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'monitoramento',
        component: MonitoramentoComponent,
        data: { title: 'Câmera ao Vivo' },
      },
      { path: 'imagens', component: ImagensComponent, data: { title: 'Imagens Capturadas' } },
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard' } },
      { path: 'entrada', component: EntradaComponent, data: { title: 'Registrar Entrada' } },
      { path: 'saida', component: SaidaComponent, data: { title: 'Registrar Saída' } },
      { path: 'veiculos', component: VeiculosComponent, data: { title: 'Veículos' } },
      { path: 'pessoas', canActivate: [adminGuard], component: PessoasComponent, data: { title: 'Pessoas' } },
      { path: 'historico', component: HistoricoComponent, data: { title: 'Histórico' } },
      { path: 'relatorios', canActivate: [adminGuard], component: RelatoriosComponent, data: { title: 'Relatórios' } },
      { path: 'usuarios', canActivate: [adminGuard], component: UsuariosComponent, data: { title: 'Usuários' } },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
