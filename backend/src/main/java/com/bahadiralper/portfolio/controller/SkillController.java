package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.SkillRequestDTO;
import com.bahadiralper.portfolio.dto.SkillResponseDTO;
import com.bahadiralper.portfolio.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public List<SkillResponseDTO> getAll(){
        return skillService.getAll();
    }

    @GetMapping("/{id}")
    public SkillResponseDTO getById(@PathVariable Integer id){
        return skillService.getById(id);
    }

    @PostMapping
    public ResponseEntity<SkillResponseDTO> create(@Valid @RequestBody SkillRequestDTO skillRequestDTO){

        SkillResponseDTO skill = skillService.create(skillRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(skill);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        skillService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public SkillResponseDTO update(@PathVariable Integer id, @Valid @RequestBody SkillRequestDTO skillRequestDTO){

        SkillResponseDTO updated = skillService.update(id, skillRequestDTO);

        return updated;

    }

}
