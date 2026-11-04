package com.bahadiralper.portfolio.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
public class ReorderRequestDTO {

    @NotNull
    private List<Integer> ids;
}
