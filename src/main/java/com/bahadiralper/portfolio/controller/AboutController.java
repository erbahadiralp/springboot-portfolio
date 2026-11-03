package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.AboutRequestDTO;
import com.bahadiralper.portfolio.dto.AboutResponseDTO;
import com.bahadiralper.portfolio.service.AboutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/about")
@RequiredArgsConstructor
public class AboutController {

    private final AboutService aboutService;

    @GetMapping
    public AboutResponseDTO getAbout(){
        return aboutService.getAbout();
    }

    @PutMapping
    public AboutResponseDTO update(@Valid @RequestBody AboutRequestDTO aboutRequestDTO){

        AboutResponseDTO updated = aboutService.update(aboutRequestDTO);

        return updated;

    }
}
