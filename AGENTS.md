# AGENTS.md — Corretor de Redações para Concursos Públicos

## Visão geral do projeto
Sistema web onde candidatos de concursos públicos submetem redações/questões discursivas
para correção automática por Inteligência Artificial.
Os critérios de correção são cadastrados manualmente pelo administrador, variando por cargo, banca e estado.

## Stack
- **Backend:** Java 25 + Spring Boot (Maven)
- **Frontend:** React + Vite (pasta `/frontend`)
- **Banco de dados:** PostgreSQL
- **Segurança:** Spring Security + JWT stateless
- **IA:** Interface genérica plugável via `AiCorrectionService`
- **Migrations:** Flyway

---

## Estrutura de pacotes do backend

```
src/main/java/com/seudominio/corretor/
├── config/             → SecurityConfig, JwtConfig, AsyncConfig, CorsConfig
├── controller/         → AuthController, AdminController, CandidatoController
├── service/            → AuthService, ProvaService, RedacaoService, UserService
├── service/ai/         → AiCorrectionService (interface), OpenAiCorrectionService (impl exemplo)
├── repository/         → interfaces JPA (UserRepository, ProvaRepository, RedacaoRepository)
├── model/
│   ├── entity/         → User, ConfiguracaoProva, CriterioCorrecao, Redacao, ResultadoCorrecao
│   └── dto/
│       ├── request/    → RegisterRequest, LoginRequest, ProvaRequest, SubmissaoRedacaoRequest
│       └── response/   → AuthResponse, ProvaResponse, ResultadoResponse, UserResponse
├── exception/          → GlobalExceptionHandler, ResourceNotFoundException, BusinessException
└── security/           → JwtFilter, JwtUtil, UserDetailsServiceImpl
```

## Estrutura do frontend

```
frontend/
├── src/
│   ├── api/            → axios instance com interceptor JWT, chamadas por domínio
│   ├── components/     → componentes reutilizáveis (PrivateRoute, Spinner, etc.)
│   ├── pages/          → Login, Registro, PainelAdmin, ListaProvas, SubmissaoRedacao, Resultado
│   ├── context/        → AuthContext (token, usuário, login, logout)
│   └── routes/         → definição de rotas com React Router
```

---

## Convenções obrigatórias

### Backend
- **Nunca** retornar entidades JPA diretamente nos controllers — sempre usar DTOs de response
- **Nunca** armazenar senha em texto plano — sempre BCrypt
- **Nunca** commitar secrets — API key da IA, JWT secret e DB password ficam em variáveis de ambiente
- Usar `@Valid` em todos os parâmetros de request nos controllers
- Usar `ResponseEntity<?>` com o status HTTP correto em todos os endpoints
- Separar rotas por perfil: `/api/auth/**` (público), `/api/admin/**` (só ADMIN), `/api/candidato/**` (só CANDIDATO)
- Handler global de exceções via `@RestControllerAdvice` — nunca expor stacktrace
- Redação limitada a 5000 caracteres via `@Size(max = 5000)` no DTO
- Processar correção da IA de forma assíncrona com `@Async`
- Validar que a soma das `notaMaxima` dos critérios não ultrapassa a `notaMaxima` da prova — retornar 422 com mensagem clara se ultrapassar
- `percentualAproveitamento` nunca deve ser calculado no frontend — vem sempre do backend no ResultadoResponse

### Frontend
- Usar interceptor do Axios para injetar o token JWT automaticamente em todas as requisições
- Usar `PrivateRoute` para proteger rotas autenticadas
- Tratar erro 401 no interceptor e redirecionar para `/login`
- Exibir feedback visual (spinner/loading) durante chamadas à API

### Geral
- Commits em português no formato convencional: `feat:`, `fix:`, `refactor:`, `chore:`
- Uma branch por funcionalidade: `feat/auth`, `feat/admin-crud`, `feat/correcao-ia`, `feat/frontend-auth`

---

## Perfis de usuário e roles

| Role | Acesso |
|------|--------|
| `ADMIN` | Cadastra e gerencia ConfiguracaoProva e CriterioCorrecao |
| `CANDIDATO` | Visualiza provas disponíveis, submete redações, consulta resultados |

---

## Variáveis de ambiente obrigatórias

```
DB_URL=jdbc:postgresql://localhost:5432/corretor
DB_USERNAME=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=sua_chave_secreta_longa
JWT_EXPIRATION=3600000

AI_PROVIDER=openai
AI_API_KEY=sua_api_key
```

---

## Modelo de dados principal

```
User              → id, nome, email, senha (hash), role, createdAt
ConfiguracaoProva → id, cargo, banca, estado, descricao, notaMaxima (double), ativo, criterios[]
CriterioCorrecao  → id, nome, descricao, notaMaxima (double, mínimo 0.1), configuracaoProva
Redacao           → id, texto, status (PENDENTE/PROCESSANDO/CONCLUIDA/ERRO), candidato, prova, createdAt
ResultadoCorrecao → id, notaTotal (double), notaMaximaProva (double), percentualAproveitamento (double),
                    feedbackGeral, avaliacoesCriterios[], redacao
```

### Regras de negócio sobre notas
- A `notaMaxima` da `ConfiguracaoProva` define o teto geral da prova (ex: 10.0, 100.0)
- A `notaMaxima` de cada `CriterioCorrecao` define o teto daquele critério específico
- A soma das `notaMaxima` dos critérios **deve** ser validada para não ultrapassar a `notaMaxima` da prova
- O `percentualAproveitamento` é calculado automaticamente: `(notaTotal / notaMaximaProva) * 100`
- A IA deve ser instruída a pontuar cada critério respeitando o teto definido em `notaMaxima`

---

## Status do fluxo de correção

```
PENDENTE → (processamento @Async) → PROCESSANDO → CONCLUIDA
                                                 → ERRO (se a chamada à IA falhar)
```

---

## Comandos do projeto

```bash
# Backend
./mvnw spring-boot:run               # rodar o backend
./mvnw test                          # rodar todos os testes
./mvnw test -Dtest=NomeDaClasse      # rodar um teste específico

# Frontend (dentro de /frontend)
npm install                          # instalar dependências
npm run dev                          # rodar em modo desenvolvimento
npm run build                        # build de produção
```

---

## Interface de IA plugável

A interface `AiCorrectionService` deve ser respeitada em todas as implementações:

```java
public interface AiCorrectionService {
    AiCorrectionResult correct(String redacaoTexto, List<CriterioCorrecao> criterios, double notaMaximaProva);
}
```

O prompt enviado à IA deve incluir, para cada critério: nome, descrição e notaMaxima.
A IA deve ser instruída a jamais atribuir nota maior que a notaMaxima de cada critério.
O provedor ativo é selecionado via `ai.provider` no `application.properties`.
Para trocar de provedor, basta criar uma nova implementação e ajustar a configuração — sem alterar nenhuma outra classe.

---

## Segurança — checklist de revisão

Antes de aceitar qualquer código gerado, verificar:
- [ ] Senha está sendo hasheada com BCrypt?
- [ ] Nenhum secret está hardcoded no código?
- [ ] O endpoint está protegido com a role correta no SecurityConfig?
- [ ] CORS está configurado apenas para a origem do frontend?
- [ ] O DTO de response não inclui o campo `senha`?
- [ ] O `GlobalExceptionHandler` está tratando a exceção em vez de expor stacktrace?
