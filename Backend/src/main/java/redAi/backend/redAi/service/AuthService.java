package redAi.backend.redAi.service;

import redAi.backend.redAi.exception.EmailAlreadyRegisteredException;
import redAi.backend.redAi.exception.InvalidCredentialsException;
import redAi.backend.redAi.model.dto.request.LoginRequest;
import redAi.backend.redAi.model.dto.request.RegisterRequest;
import redAi.backend.redAi.model.dto.response.AuthResponse;
import redAi.backend.redAi.model.dto.response.UserResponse;
import redAi.backend.redAi.model.entity.Role;
import redAi.backend.redAi.model.entity.User;
import redAi.backend.redAi.repository.UserRepository;
import redAi.backend.redAi.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException("Email já cadastrado");
        }

        User user = User.builder()
                .nome(request.getNome().trim())
                .email(email)
                .senha(passwordEncoder.encode(request.getSenha()))
                .role(Role.CANDIDATO)
                .build();

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.getSenha(), user.getSenha())) {
            throw new InvalidCredentialsException("Credenciais inválidas");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
