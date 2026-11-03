package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.ExperienceRequestDTO;
import com.bahadiralper.portfolio.dto.ExperienceResponseDTO;
import com.bahadiralper.portfolio.service.ExperienceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public List<ExperienceResponseDTO> getAll(){
        return experienceService.getAll();
    }

    @GetMapping("/{id}")
    public ExperienceResponseDTO getById(@PathVariable Integer id){
        return experienceService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ExperienceResponseDTO> create(@Valid @RequestBody ExperienceRequestDTO experienceRequestDTO){

        ExperienceResponseDTO experience = experienceService.create(experienceRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(experience);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        experienceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ExperienceResponseDTO update(@PathVariable Integer id, @Valid @RequestBody ExperienceRequestDTO experienceRequestDTO){

        ExperienceResponseDTO updated = experienceService.update(id, experienceRequestDTO);

        return updated;

    }
}
