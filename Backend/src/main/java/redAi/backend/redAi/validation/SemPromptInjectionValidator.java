package redAi.backend.redAi.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

public class SemPromptInjectionValidator implements ConstraintValidator<SemPromptInjection, String> {

    private static final List<Pattern> PADROES_GRAVES = List.of(
            Pattern.compile("\\bignore\\s+previous\\s+instructions\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bignore\\s+as\\s+instrucoes\\s+anteriores\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\byou\\s+are\\s+now\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bact\\s+as\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bnovo\\s+sistema\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bnovo\\s+prompt\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bsystem\\s+prompt\\b", Pattern.CASE_INSENSITIVE)
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        String textoNormalizado = normalizar(value);
        return PADROES_GRAVES.stream().noneMatch(pattern -> pattern.matcher(textoNormalizado).find());
    }

    private String normalizar(String texto) {
        String normalized = Normalizer.normalize(texto, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }
}
