package redAi.backend.redAi.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import redAi.backend.redAi.model.entity.Role;
import redAi.backend.redAi.model.entity.User;
import redAi.backend.redAi.repository.UserRepository;

@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedTestUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            createUserIfMissing(
                    userRepository,
                    passwordEncoder,
                    "Admin Teste",
                    "admin.teste@redai.local",
                    "Admin@123",
                    Role.ADMIN
            );

            createUserIfMissing(
                    userRepository,
                    passwordEncoder,
                    "Candidato Teste",
                    "candidato.teste@redai.local",
                    "Candidato@123",
                    Role.CANDIDATO
            );
        };
    }

    private void createUserIfMissing(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String nome,
            String email,
            String senha,
            Role role
    ) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = User.builder()
                .nome(nome)
                .email(email)
                .senha(passwordEncoder.encode(senha))
                .role(role)
                .build();

        userRepository.save(user);
    }
}
