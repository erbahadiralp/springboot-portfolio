package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.EducationRequestDTO;
import com.bahadiralper.portfolio.dto.EducationResponseDTO;
import com.bahadiralper.portfolio.service.EducationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/educations")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @GetMapping
    public List<EducationResponseDTO> getAll(){
        return educationService.getAll();
    }

    @GetMapping("/{id}")
    public EducationResponseDTO getById(@PathVariable Integer id){
        return educationService.getById(id);
    }

    @PostMapping
    public ResponseEntity<EducationResponseDTO> create(@Valid @RequestBody EducationRequestDTO educationRequestDTO){

        EducationResponseDTO education = educationService.create(educationRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(education);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        educationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public EducationResponseDTO update(@PathVariable Integer id, @Valid @RequestBody EducationRequestDTO educationRequestDTO){

        EducationResponseDTO updated = educationService.update(id, educationRequestDTO);

        return updated;

    }
}
