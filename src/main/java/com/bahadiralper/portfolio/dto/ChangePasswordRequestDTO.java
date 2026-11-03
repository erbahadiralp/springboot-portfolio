package com.bahadiralper.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequestDTO {

    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 12, max = 72, message = "Şifre 12 ile 72 karakter arasında olmalı")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$",
            message = "Şifre en az bir küçük harf, bir büyük harf ve bir sembol içermeli")
    private String newPassword;


}
