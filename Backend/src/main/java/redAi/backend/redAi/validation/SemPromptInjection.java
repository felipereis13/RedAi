package redAi.backend.redAi.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = SemPromptInjectionValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SemPromptInjection {

    String message() default "O texto da redação contém conteúdo não permitido.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
