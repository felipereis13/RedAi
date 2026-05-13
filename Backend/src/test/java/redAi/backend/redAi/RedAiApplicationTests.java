package redAi.backend.redAi;

import com.jayway.jsonpath.JsonPath;
import redAi.backend.redAi.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
class RedAiApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtUtil jwtUtil;

	@Test
	void contextLoads() {
	}

	@Test
	void adminSemTokenRetorna401() throws Exception {
		mockMvc.perform(get("/api/admin/"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void adminComTokenDeCandidatoRetorna403() throws Exception {
		String token = jwtUtil.generateToken("candidato@example.com", "CANDIDATO");

		mockMvc.perform(get("/api/admin/")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isForbidden());
	}

	@Test
	void registerComDadosValidosRetorna201EToken() throws Exception {
		mockMvc.perform(post("/api/auth/register")
						.contentType("application/json")
						.content("""
								{
								  "nome": "Maria Silva",
								  "email": "maria.register@example.com",
								  "senha": "senha1234"
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.token").isString())
				.andExpect(jsonPath("$.user.id").isNumber())
				.andExpect(jsonPath("$.user.nome").value("Maria Silva"))
				.andExpect(jsonPath("$.user.email").value("maria.register@example.com"))
				.andExpect(jsonPath("$.user.role").value("CANDIDATO"))
				.andExpect(jsonPath("$.user.senha").doesNotExist());
	}

	@Test
	void loginComCredenciaisCorretasRetorna200EToken() throws Exception {
		mockMvc.perform(post("/api/auth/register")
						.contentType("application/json")
						.content("""
								{
								  "nome": "Joao Souza",
								  "email": "joao.login@example.com",
								  "senha": "senha1234"
								}
								"""))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/auth/login")
						.contentType("application/json")
						.content("""
								{
								  "email": "joao.login@example.com",
								  "senha": "senha1234"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").isString())
				.andExpect(jsonPath("$.user.email").value("joao.login@example.com"))
				.andExpect(jsonPath("$.user.role").value("CANDIDATO"));
	}

	@Test
	void loginComSenhaErradaRetorna401() throws Exception {
		mockMvc.perform(post("/api/auth/register")
						.contentType("application/json")
						.content("""
								{
								  "nome": "Ana Lima",
								  "email": "ana.login@example.com",
								  "senha": "senha1234"
								}
								"""))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/auth/login")
						.contentType("application/json")
						.content("""
								{
								  "email": "ana.login@example.com",
								  "senha": "senha-errada"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Credenciais inválidas"));
	}

	@Test
	void registerComEmailJaCadastradoRetorna409() throws Exception {
		String request = """
				{
				  "nome": "Pedro Costa",
				  "email": "pedro.duplicado@example.com",
				  "senha": "senha1234"
				}
				""";

		mockMvc.perform(post("/api/auth/register")
						.contentType("application/json")
						.content(request))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/auth/register")
						.contentType("application/json")
						.content(request))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Email já cadastrado"));
	}

	@Test
	void cicloCompletoCrudDeProvasFunciona() throws Exception {
		String adminToken = jwtUtil.generateToken("admin@example.com", "ADMIN");

		MvcResult createResult = mockMvc.perform(post("/api/admin/provas")
						.header("Authorization", "Bearer " + adminToken)
						.contentType("application/json")
						.content("""
								{
								  "cargo": "Analista Judiciário",
								  "banca": "CEBRASPE",
								  "estado": "DF",
								  "descricao": "Prova discursiva",
								  "notaMaxima": 10.0,
								  "criterios": [
								    {
								      "nome": "Conteúdo",
								      "descricao": "Domínio do tema",
								      "notaMaxima": 6.0
								    },
								    {
								      "nome": "Forma",
								      "descricao": "Coesão e gramática",
								      "notaMaxima": 4.0
								    }
								  ]
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.notaMaxima").value(10.0))
				.andExpect(jsonPath("$.ativo").value(true))
				.andExpect(jsonPath("$.criterios[0].notaMaxima").value(6.0))
				.andReturn();

		Integer provaId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.id");

		mockMvc.perform(get("/api/admin/provas")
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)));

		mockMvc.perform(put("/api/admin/provas/{id}", provaId)
						.header("Authorization", "Bearer " + adminToken)
						.contentType("application/json")
						.content("""
								{
								  "cargo": "Auditor Fiscal",
								  "banca": "FGV",
								  "estado": "SP",
								  "descricao": "Questão discursiva atualizada",
								  "notaMaxima": 100.0,
								  "criterios": [
								    {
								      "nome": "Conhecimento técnico",
								      "descricao": "Precisão jurídica",
								      "notaMaxima": 70.0
								    },
								    {
								      "nome": "Redação",
								      "descricao": "Clareza e norma culta",
								      "notaMaxima": 30.0
								    }
								  ]
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cargo").value("Auditor Fiscal"))
				.andExpect(jsonPath("$.notaMaxima").value(100.0))
				.andExpect(jsonPath("$.criterios[0].notaMaxima").value(70.0));

		mockMvc.perform(delete("/api/admin/provas/{id}", provaId)
						.header("Authorization", "Bearer " + adminToken))
				.andExpect(status().isNoContent());
	}

	@Test
	void criarProvaComSomaDosCriteriosAcimaDaNotaMaximaRetorna422() throws Exception {
		String adminToken = jwtUtil.generateToken("admin@example.com", "ADMIN");

		mockMvc.perform(post("/api/admin/provas")
						.header("Authorization", "Bearer " + adminToken)
						.contentType("application/json")
						.content("""
								{
								  "cargo": "Técnico",
								  "banca": "FCC",
								  "estado": "RJ",
								  "descricao": "Redação",
								  "notaMaxima": 10.0,
								  "criterios": [
								    {
								      "nome": "Conteúdo",
								      "descricao": "Domínio do tema",
								      "notaMaxima": 8.0
								    },
								    {
								      "nome": "Forma",
								      "descricao": "Coesão e gramática",
								      "notaMaxima": 4.0
								    }
								  ]
								}
								"""))
				.andExpect(status().is(422))
				.andExpect(jsonPath("$.message").value("A soma das notas máximas dos critérios não pode ultrapassar a nota máxima da prova"));
	}

}
