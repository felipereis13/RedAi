package redAi.backend.redAi.service;

import redAi.backend.redAi.exception.ResourceNotFoundException;
import redAi.backend.redAi.model.dto.request.SugestaoTemaRequest;
import redAi.backend.redAi.model.dto.response.SugestaoTemaResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.SugestaoTema;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.SugestaoTemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SugestaoTemaService {

    private final SugestaoTemaRepository sugestaoTemaRepository;
    private final ConfiguracaoProvaRepository provaRepository;

    public SugestaoTemaService(
            SugestaoTemaRepository sugestaoTemaRepository,
            ConfiguracaoProvaRepository provaRepository
    ) {
        this.sugestaoTemaRepository = sugestaoTemaRepository;
        this.provaRepository = provaRepository;
    }

    @Transactional(readOnly = true)
    public List<SugestaoTemaResponse> listarAdmin(Long idProva) {
        garantirProvaExiste(idProva);
        return sugestaoTemaRepository.findByConfiguracaoProvaIdOrderByIdDesc(idProva).stream()
                .map(SugestaoTemaResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SugestaoTemaResponse> listarAtivas(Long idProva) {
        garantirProvaExiste(idProva);
        return sugestaoTemaRepository.findByConfiguracaoProvaIdAndAtivoTrueOrderByIdDesc(idProva).stream()
                .map(SugestaoTemaResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SugestaoTemaResponse criar(Long idProva, SugestaoTemaRequest request) {
        ConfiguracaoProva prova = garantirProvaExiste(idProva);
        SugestaoTema sugestao = SugestaoTema.builder()
                .titulo(request.titulo().trim())
                .descricao(normalizeDescricao(request.descricao()))
                .ativo(request.ativo() == null || request.ativo())
                .configuracaoProva(prova)
                .build();

        return SugestaoTemaResponse.fromEntity(sugestaoTemaRepository.save(sugestao));
    }

    @Transactional
    public SugestaoTemaResponse atualizar(Long idProva, Long id, SugestaoTemaRequest request) {
        SugestaoTema sugestao = buscarSugestaoDaProva(idProva, id);
        sugestao.setTitulo(request.titulo().trim());
        sugestao.setDescricao(normalizeDescricao(request.descricao()));
        if (request.ativo() != null) {
            sugestao.setAtivo(request.ativo());
        }

        return SugestaoTemaResponse.fromEntity(sugestao);
    }

    @Transactional
    public void desativar(Long idProva, Long id) {
        SugestaoTema sugestao = buscarSugestaoDaProva(idProva, id);
        sugestao.setAtivo(false);
    }

    private ConfiguracaoProva garantirProvaExiste(Long idProva) {
        return provaRepository.findById(idProva)
                .orElseThrow(() -> new ResourceNotFoundException("Prova nao encontrada"));
    }

    private SugestaoTema buscarSugestaoDaProva(Long idProva, Long id) {
        garantirProvaExiste(idProva);
        return sugestaoTemaRepository.findByIdAndConfiguracaoProvaId(id, idProva)
                .orElseThrow(() -> new ResourceNotFoundException("Sugestao de tema nao encontrada"));
    }

    private String normalizeDescricao(String descricao) {
        return descricao == null || descricao.isBlank() ? null : descricao.trim();
    }
}
