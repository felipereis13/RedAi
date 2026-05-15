package redAi.backend.redAi.service;

import redAi.backend.redAi.exception.BusinessException;
import redAi.backend.redAi.exception.ResourceNotFoundException;
import redAi.backend.redAi.model.dto.response.EspelhoCorrecaoResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.EspelhoCorrecao;
import redAi.backend.redAi.model.entity.TipoEspelhoCorrecao;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.EspelhoCorrecaoRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EspelhoCorrecaoService {

    private static final int LIMITE_POR_TIPO = 2;
    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final Path UPLOADS_BASE_PATH = Paths.get("uploads", "espelhos");

    private final EspelhoCorrecaoRepository espelhoRepository;
    private final ConfiguracaoProvaRepository provaRepository;

    public EspelhoCorrecaoService(
            EspelhoCorrecaoRepository espelhoRepository,
            ConfiguracaoProvaRepository provaRepository
    ) {
        this.espelhoRepository = espelhoRepository;
        this.provaRepository = provaRepository;
    }

    @Transactional(readOnly = true)
    public List<EspelhoCorrecaoResponse> listar(Long idProva) {
        return espelhoRepository.findByConfiguracaoProvaIdOrderByTipoAscOrdemAsc(idProva).stream()
                .map(EspelhoCorrecaoResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EspelhoCorrecaoResponse criar(
            Long idProva,
            String titulo,
            TipoEspelhoCorrecao tipo,
            String conteudoTexto,
            MultipartFile arquivo
    ) {
        ConfiguracaoProva prova = provaRepository.findById(idProva)
                .orElseThrow(() -> new ResourceNotFoundException("Prova nao encontrada"));

        validarTitulo(titulo);
        validarTipo(tipo);

        List<EspelhoCorrecao> existentes = espelhoRepository.findByConfiguracaoProvaIdAndTipoOrderByOrdemAsc(idProva, tipo);
        long totalPorTipo = existentes.size();
        if (totalPorTipo >= LIMITE_POR_TIPO) {
            throw new BusinessException("Limite de 2 registros do tipo " + tipo + " por prova foi ultrapassado");
        }

        ArquivoProcessado arquivoProcessado = processarArquivo(idProva, arquivo);
        String textoNormalizado = normalizarTexto(conteudoTexto);
        String textoExtraido = normalizarTexto(arquivoProcessado.conteudoExtraido());
        String conteudoFinal = juntarTextos(textoNormalizado, textoExtraido);

        if (conteudoFinal == null && arquivoProcessado.caminhoArquivo() == null) {
            throw new BusinessException("Informe conteudoTexto ou um arquivo PDF para o espelho");
        }

        EspelhoCorrecao espelho = EspelhoCorrecao.builder()
                .titulo(titulo.trim())
                .conteudoTexto(conteudoFinal)
                .nomeArquivo(arquivoProcessado.nomeArquivo())
                .caminhoArquivo(arquivoProcessado.caminhoArquivo())
                .tipo(tipo)
                .ordem(proximaOrdemLivre(existentes))
                .configuracaoProva(prova)
                .build();

        return EspelhoCorrecaoResponse.fromEntity(espelhoRepository.save(espelho));
    }

    @Transactional
    public void excluir(Long idProva, Long id) {
        EspelhoCorrecao espelho = espelhoRepository.findByIdAndConfiguracaoProvaId(id, idProva)
                .orElseThrow(() -> new ResourceNotFoundException("Espelho de correcao nao encontrado"));

        String caminhoArquivo = espelho.getCaminhoArquivo();
        espelhoRepository.delete(espelho);
        excluirArquivoFisico(caminhoArquivo);
    }

    private void validarTitulo(String titulo) {
        if (titulo == null || titulo.isBlank()) {
            throw new BusinessException("Titulo do espelho e obrigatorio");
        }
    }

    private void validarTipo(TipoEspelhoCorrecao tipo) {
        if (tipo == null) {
            throw new BusinessException("Tipo do espelho e obrigatorio");
        }
    }

    private int proximaOrdemLivre(List<EspelhoCorrecao> existentes) {
        Set<Integer> ordensOcupadas = existentes.stream()
                .map(EspelhoCorrecao::getOrdem)
                .collect(Collectors.toSet());

        for (int ordem = 1; ordem <= LIMITE_POR_TIPO; ordem++) {
            if (!ordensOcupadas.contains(ordem)) {
                return ordem;
            }
        }

        throw new BusinessException("Limite de 2 registros por tipo foi ultrapassado");
    }

    private ArquivoProcessado processarArquivo(Long idProva, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            return new ArquivoProcessado(null, null, null);
        }

        validarArquivoPdf(arquivo);

        try {
            Path diretorio = UPLOADS_BASE_PATH.resolve(idProva.toString());
            Files.createDirectories(diretorio);

            String nomeOriginal = arquivo.getOriginalFilename();
            String extensao = extrairExtensao(nomeOriginal);
            String nomeUnico = UUID.randomUUID() + extensao;
            Path caminhoDestino = diretorio.resolve(nomeUnico);
            arquivo.transferTo(caminhoDestino);

            String textoExtraido = extrairTextoPdf(caminhoDestino);
            return new ArquivoProcessado(nomeOriginal, caminhoDestino.toString(), textoExtraido);
        } catch (IOException exception) {
            throw new BusinessException("Nao foi possivel salvar ou processar o PDF enviado");
        }
    }

    private void validarArquivoPdf(MultipartFile arquivo) {
        String nomeArquivo = arquivo.getOriginalFilename();
        boolean extensaoPdf = nomeArquivo != null && nomeArquivo.toLowerCase(Locale.ROOT).endsWith(".pdf");
        boolean contentTypePdf = PDF_CONTENT_TYPE.equalsIgnoreCase(arquivo.getContentType());

        if (!extensaoPdf || !contentTypePdf) {
            throw new BusinessException("Apenas arquivos PDF sao permitidos");
        }
    }

    private String extrairTextoPdf(Path caminhoArquivo) throws IOException {
        try (PDDocument document = Loader.loadPDF(caminhoArquivo.toFile())) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extrairExtensao(String nomeArquivo) {
        if (nomeArquivo == null || !nomeArquivo.contains(".")) {
            return ".pdf";
        }
        return nomeArquivo.substring(nomeArquivo.lastIndexOf('.')).toLowerCase(Locale.ROOT);
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        return texto.trim();
    }

    private String juntarTextos(String textoInformado, String textoExtraido) {
        if (textoInformado == null) {
            return textoExtraido;
        }
        if (textoExtraido == null) {
            return textoInformado;
        }
        return textoInformado + "\n\n" + textoExtraido;
    }

    private void excluirArquivoFisico(String caminhoArquivo) {
        if (caminhoArquivo == null || caminhoArquivo.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(Path.of(caminhoArquivo));
        } catch (IOException exception) {
            throw new BusinessException("Registro removido, mas nao foi possivel excluir o arquivo fisico");
        }
    }

    private record ArquivoProcessado(String nomeArquivo, String caminhoArquivo, String conteudoExtraido) {
    }
}
