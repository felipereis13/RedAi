package redAi.backend.redAi.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.config.properties.JwtProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String TOKEN_TYPE = "JWT";
    private static final String ALGORITHM = "HS256";

    private final String secret;
    private final long expirationMillis;
    private final ObjectMapper objectMapper;

    public JwtUtil(JwtProperties jwtProperties) {
        this.secret = jwtProperties.secret();
        this.expirationMillis = jwtProperties.expiration();
        this.objectMapper = new ObjectMapper();
    }

    public String generateToken(String email, String role) {
        long now = Instant.now().toEpochMilli();

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("typ", TOKEN_TYPE);
        header.put("alg", ALGORITHM);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", email);
        payload.put("role", role);
        payload.put("iat", now / 1000);
        payload.put("exp", (now + expirationMillis) / 1000);

        String headerPart = encodeJson(header);
        String payloadPart = encodeJson(payload);
        String signaturePart = sign(headerPart + "." + payloadPart);

        return headerPart + "." + payloadPart + "." + signaturePart;
    }

    public boolean isTokenValid(String token) {
        try {
            Map<String, Object> claims = extractClaims(token);
            Number expiration = (Number) claims.get("exp");

            return expiration != null && expiration.longValue() > Instant.now().getEpochSecond();
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public String extractEmail(String token) {
        Object subject = extractClaims(token).get("sub");
        return subject == null ? null : subject.toString();
    }

    public String extractRole(String token) {
        Object role = extractClaims(token).get("role");
        return role == null ? null : role.toString();
    }

    private Map<String, Object> extractClaims(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Token JWT inválido");
        }

        String expectedSignature = sign(parts[0] + "." + parts[1]);
        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new IllegalArgumentException("Assinatura JWT inválida");
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(payloadBytes, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new IllegalArgumentException("Payload JWT inválido", exception);
        }
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar o JWT", exception);
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] signature = mac.doFinal(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível assinar o JWT", exception);
        }
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigestUtil.constantTimeEquals(
                first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static final class MessageDigestUtil {
        private MessageDigestUtil() {
        }

        static boolean constantTimeEquals(byte[] first, byte[] second) {
            if (first.length != second.length) {
                return false;
            }

            int result = 0;
            for (int index = 0; index < first.length; index++) {
                result |= first[index] ^ second[index];
            }
            return result == 0;
        }
    }
}
