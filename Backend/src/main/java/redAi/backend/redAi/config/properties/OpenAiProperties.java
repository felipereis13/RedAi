package redAi.backend.redAi.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(Api api, String model) {

    public String apiUrl() {
        return api == null ? null : api.url();
    }

    public record Api(String url) {
    }
}
