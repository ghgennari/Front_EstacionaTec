# EstacionaTec — Front-end

Interface web do **EstacionaTec**, Trabalho de Graduação do curso de Análise e Desenvolvimento de Sistemas da Fatec Itu “Dom Amaury Castanho”. O projeto propõe digitalizar o controle de acesso ao estacionamento da instituição, organizando cadastros de pessoas e veículos, entradas, saídas e consultas de movimentações.

Este repositório contém o front-end em Angular. O backend e os dispositivos físicos são partes separadas da solução.

## Estado da versão publicada

A versão publicada utiliza dados demonstrativos e armazenamento em memória no navegador. A integração com o backend está em desenvolvimento local e ainda não faz parte dos commits disponíveis neste repositório.

- Pessoas, Veículos e Registro de Entrada compartilham dados pelo `ParkingRegistryService`.
- Dashboard, Saída e Histórico utilizam listas próprias, sem sincronização completa entre as movimentações.
- Os dados não persistem após recarregar a aplicação; listas locais também podem ser reiniciadas ao navegar entre telas.
- Login e recuperação de senha são demonstrativos: não há autenticação real, envio de e-mail ou proteção das rotas nesta versão.
- Câmera, capturas, abertura do portão e relatórios não possuem integração operacional publicada.

## Telas e funcionalidades

| Tela | Funcionalidades no front-end publicado |
| --- | --- |
| Login | Formulário de acesso, validação de preenchimento e opção de exibir a senha. |
| Recuperação de senha | Validação básica do e-mail e confirmação visual demonstrativa. |
| Dashboard | Indicadores de entradas e saídas e tabela de veículos estacionados com dados de exemplo. |
| Registrar Entrada | Consulta de placa com ou sem hífen, identificação do proprietário e categoria, registro do horário em memória e botão de abertura manual com aviso de indisponibilidade. |
| Registrar Saída | Busca por placa, proprietário, marca ou modelo e remoção do veículo da lista demonstrativa da tela. |
| Pessoas | Cadastro, pesquisa, edição e exclusão com confirmação; bloqueio de exclusão de pessoas com veículos vinculados. |
| Veículos | Cadastro, pesquisa, edição e exclusão; exibição da categoria do proprietário. |
| Histórico | Permanências encerradas, modelo, entrada, saída, duração e acesso ao cadastro do proprietário. |
| Usuários | Cadastro, pesquisa, edição e exclusão de operadores; seleção de nível e status, sem aplicação real de permissões. |
| Câmera ao Vivo | Painel demonstrativo, relógio, tela cheia e detalhes de eventos de exemplo. |
| Imagens Capturadas | Filtros por placa, data, tipo e status, paginação e consulta de metadados; sem imagens reais para download. |
| Relatórios | Seleção de período e tipo de relatório, com avisos de integração pendente; sem geração ou download de PDF. |

Na entrada, o formato aceito atualmente é `ABC-1234` ou `ABC1234`, sem distinção entre maiúsculas e minúsculas. Placas Mercosul ainda não são aceitas por essa validação.

## Tecnologias

- Angular 22 com **NgModules** e componentes não standalone.
- TypeScript 6 e RxJS 7.
- HTML e CSS próprio para o layout e os componentes visuais.
- Angular Router para navegação e FormsModule para formulários com `ngModel`.
- Vitest para testes e Prettier para formatação.

## Como executar

### Pré-requisitos

- Node.js compatível com Angular CLI 22: `^22.22.3`, `^24.15.0` ou `>=26.0.0`.
- npm e Git instalados.

O projeto declara npm `11.17.0` como gerenciador de pacotes.

```bash
git clone https://github.com/ghgennari/Front_EstacionaTec.git
cd Front_EstacionaTec
npm ci
npm start
```

Acesse **http://localhost:4200/**. A versão demonstrativa publicada não exige backend ou banco de dados em execução.

No login, é possível usar `admin@edu.br` e `admin123`, conforme o exemplo exibido. Não são credenciais reais: o código publicado apenas verifica o preenchimento do usuário e o comprimento mínimo da senha.

### Compilação e testes

```bash
# Compilação de produção
npm run build

# Executar os testes uma vez
npm test -- --watch=false

# Testes em modo de desenvolvimento
npm test
```

A compilação é gerada em `dist/estacionatec-web/`. Os testes cobrem comportamentos de cadastro, entrada, histórico, usuários, filtros de imagens e temporizadores do monitoramento. Não representam validação de hardware ou integração com um servidor real.

## Organização do código

```text
src/
├── app/
│   ├── core/services/      # Cadastros e entradas compartilhados em memória
│   ├── layout/             # Layout principal, cabeçalho e menu lateral
│   ├── pages/
│   │   ├── auth/           # Login e recuperação de senha
│   │   ├── dashboard/
│   │   ├── entrada/
│   │   ├── saida/
│   │   ├── pessoas/
│   │   ├── veiculos/
│   │   ├── historico/
│   │   ├── usuarios/
│   │   ├── monitoramento/
│   │   ├── imagens/
│   │   └── relatorios/
│   ├── app-module.ts       # Declarações e módulos utilizados
│   ├── app-routing-module.ts
│   └── app.html            # Router-outlet principal
├── main.ts                 # Inicialização do AppModule
└── styles.css              # Estilos compartilhados
public/assets/              # Logos
```

Cada tela separa a estrutura visual (`.component.html`) da lógica (`.component.ts`). O layout principal organiza o menu, o cabeçalho e o `router-outlet` das páginas internas. As telas de autenticação ficam fora desse layout.

## Arquitetura prevista na documentação

A solução proposta utiliza Angular no navegador, uma API em Java com Spring Boot e PostgreSQL para persistência. A câmera IP e o ESP32 fazem parte da integração física prevista para captura de imagens e acionamento da cancela.

O fluxo previsto depende da identificação da placa e da confirmação do operador. O reconhecimento automático por OCR/ALPR é uma evolução futura, não uma funcionalidade concluída ou validada nesta versão.

As próximas etapas incluem publicar e validar a integração com a API, unificar os registros de entrada e saída, persistir os cadastros, aplicar autenticação e permissões e conectar os recursos de hardware e relatórios. A existência das telas não significa que essas integrações já estejam disponíveis.

## Documentação

- [Documentação do projeto — EstacionaTec](docs/EstacionaTec%20-%20Corre%C3%A7%C3%B5es.docx): contexto acadêmico, requisitos, modelagem e proposta da solução.
- [Guia comentado do front-end](output/pdf/EstacionaTec-Guia-Comentado-do-Frontend.pdf): explicações das telas, componentes e limitações do código analisado em 14/09/2026.

A documentação descreve o escopo geral do trabalho. Para identificar o que está implementado nesta publicação, consulte a seção de estado da versão e o código deste repositório.

## Autores

- Gustavo Henrique Gennari
- Ryan Lucas Diniz Torres

Trabalho de Graduação em Análise e Desenvolvimento de Sistemas — Fatec Itu.
