package redAi.backend.redAi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TextoSanitizador {

    private static final Logger LOGGER = LoggerFactory.getLogger(TextoSanitizador.class);
    private static final int LIMITE_CARACTERES_IA = 6000;
    private static final String MARCADOR_REMOCAO = "[conteudo removido]";

    private static final List<Pattern> PADROES_INJECTION = List.of(
            Pattern.compile("\\b(ignore|esqueca|novo\\s+prompt|act\\s+as|you\\s+are\\s+now|ignore\\s+previous|ignore\\s+as\\s+instrucoes|finja\\s+que|simule\\s+que|sua\\s+nova\\s+instrucao)\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(system|user|assistant)\\s*:", Pattern.CASE_INSENSITIVE),
            Pattern.compile("###|---|```|<\\||\\|>|\\[INST]|\\[/INST]|<<SYS>>|<</SYS>>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(\\R\\s*){6,}")
    );

    public String sanitizar(String textoRedacao) {
        return sanitizar(null, textoRedacao);
    }

    public String sanitizar(Long redacaoId, String textoRedacao) {
        if (textoRedacao == null) {
            return null;
        }

        String textoSanitizado = truncar(textoRedacao);
        for (Pattern pattern : PADROES_INJECTION) {
            textoSanitizado = removerOcorrencias(redacaoId, textoSanitizado, pattern);
        }

        return textoSanitizado;
    }

    private String removerOcorrencias(Long redacaoId, String texto, Pattern pattern) {
        String textoNormalizado = normalizarParaComparacao(texto);
        Matcher matcher = pattern.matcher(textoNormalizado);
        StringBuilder resultado = new StringBuilder(texto);
        int deslocamento = 0;

        while (matcher.find()) {
            int inicio = matcher.start() + deslocamento;
            int fim = matcher.end() + deslocamento;
            String trechoRemovido = resultado.substring(inicio, fim);
            LOGGER.warn(
                    "Prompt injection sanitizado na redacao {}. Trecho removido: {}",
                    redacaoId == null ? "sem-id" : redacaoId,
                    trechoRemovido
            );
            resultado.replace(inicio, fim, MARCADOR_REMOCAO);
            deslocamento += MARCADOR_REMOCAO.length() - (fim - inicio);
        }

        return resultado.toString();
    }

    private String truncar(String texto) {
        if (texto.length() <= LIMITE_CARACTERES_IA) {
            return texto;
        }
        return texto.substring(0, LIMITE_CARACTERES_IA);
    }

    private String normalizarParaComparacao(String texto) {
        String normalized = Normalizer.normalize(texto, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }
}
