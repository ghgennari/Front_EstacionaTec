import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MonitoramentoComponent } from './pages/monitoramento/monitoramento.component';
import { ImagensComponent } from './pages/imagens/imagens.component';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HeaderComponent } from './layout/header/header.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
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

@NgModule({
  declarations: [
    MonitoramentoComponent,
    ImagensComponent,
    App,
    HeaderComponent,
    MainLayoutComponent,
    SidebarComponent,
    LoginComponent,
    RecuperarSenhaComponent,
    DashboardComponent,
    EntradaComponent,
    HistoricoComponent,
    PessoasComponent,
    RelatoriosComponent,
    SaidaComponent,
    UsuariosComponent,
    VeiculosComponent,
  ],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
