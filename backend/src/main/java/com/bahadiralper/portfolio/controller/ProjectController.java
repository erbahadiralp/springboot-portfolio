package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.*;
import com.bahadiralper.portfolio.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public List<ProjectResponseDTO> getAll(){
        return projectService.getAll();
    }

    @GetMapping("/{id}")
    public ProjectResponseDTO getById(@PathVariable Integer id){
        return projectService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ProjectResponseDTO> create(@Valid @RequestBody ProjectRequestDTO projectRequestDTO){

        ProjectResponseDTO project = projectService.create(projectRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(project);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id){

        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ProjectResponseDTO update(@PathVariable Integer id, @Valid @RequestBody ProjectRequestDTO projectRequestDTO){

        ProjectResponseDTO updated = projectService.update(id, projectRequestDTO);

        return updated;

    }


    @PutMapping("/order")
    public ResponseEntity<Void> reorderProjects(@Valid @RequestBody ReorderRequestDTO reorderRequestDTO){

        projectService.reorder(reorderRequestDTO);

        return ResponseEntity.noContent().build();

    }
}
