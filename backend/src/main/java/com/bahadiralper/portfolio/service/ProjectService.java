package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.*;
import com.bahadiralper.portfolio.entity.Project;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final FileUsageService fileUsageService;

    private ProjectResponseDTO toResponse(Project project){

        ProjectResponseDTO responseDTO = new ProjectResponseDTO();

        responseDTO.setId(project.getId());
        responseDTO.setTitleTr(project.getTitleTr());
        responseDTO.setTitleEn(project.getTitleEn());
        responseDTO.setDescriptionTr(project.getDescriptionTr());
        responseDTO.setDescriptionEn(project.getDescriptionEn());
        responseDTO.setTools(project.getTools());
        responseDTO.setLink(project.getLink());
        responseDTO.setDemoUrl(project.getDemoUrl());
        responseDTO.setImageUrl(project.getImageUrl());
        responseDTO.setDisplayOrder(project.getDisplayOrder());


        return responseDTO;
    }

    public List<ProjectResponseDTO> getAll(){

        List<Project> projects = projectRepository.findAllByOrderByDisplayOrderAsc();

        List<ProjectResponseDTO> projectResponseDTOList = new ArrayList<>();

        for (Project project: projects){
            projectResponseDTOList.add(toResponse(project));
        }

        return projectResponseDTOList;
    }

    public ProjectResponseDTO getById(Integer id){
        return toResponse(findProjectById(id));

    }

    private Project findProjectById(Integer id){
        return projectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Proje bulunamadı:" + id));
    }

    private Project toEntity(ProjectRequestDTO projectRequestDTO){

        Project project = new Project();

        project.setTitleTr(projectRequestDTO.getTitleTr());
        project.setTitleEn(projectRequestDTO.getTitleEn());
        project.setDescriptionTr(projectRequestDTO.getDescriptionTr());
        project.setDescriptionEn(projectRequestDTO.getDescriptionEn());
        project.setTools(projectRequestDTO.getTools());
        project.setLink(projectRequestDTO.getLink());
        project.setDemoUrl(projectRequestDTO.getDemoUrl());
        project.setImageUrl(projectRequestDTO.getImageUrl());

        return project;
    }

    public ProjectResponseDTO create(ProjectRequestDTO projectRequestDTO){

        Project project = toEntity(projectRequestDTO);

        List<Project> projects = projectRepository.findAllByOrderByDisplayOrderAsc();

        int nextOrder = 0;


        if (!projects.isEmpty()){

            Project last = projects.getLast();

            nextOrder = last.getDisplayOrder() + 1;
        }

        project.setDisplayOrder(nextOrder);

        Project saved = projectRepository.save(project);

        return toResponse(saved);
    }

    public ProjectResponseDTO update(Integer id, ProjectRequestDTO requestDTO){


        Project entity = findProjectById(id);


        String oldImageUrl = entity.getImageUrl();


        entity.setTitleTr(requestDTO.getTitleTr());
        entity.setTitleEn(requestDTO.getTitleEn());
        entity.setDescriptionTr(requestDTO.getDescriptionTr());
        entity.setDescriptionEn(requestDTO.getDescriptionEn());
        entity.setTools(requestDTO.getTools());
        entity.setLink(requestDTO.getLink());
        entity.setDemoUrl(requestDTO.getDemoUrl());
        entity.setImageUrl(requestDTO.getImageUrl());

        Project updated = projectRepository.save(entity);

        if (!Objects.equals(oldImageUrl, requestDTO.getImageUrl())){
            fileUsageService.deleteIfUnused(oldImageUrl);

        }

        return toResponse(updated);
    }

    public void delete(Integer id){

        Project entity = findProjectById(id);

        projectRepository.delete(entity);

        fileUsageService.deleteIfUnused(entity.getImageUrl());
    }

    @Transactional
    public void reorder(ReorderRequestDTO reorderRequestDTO){

        Set<Integer> requestedIds = new HashSet<>(reorderRequestDTO.getIds());

        if (requestedIds.size() != reorderRequestDTO.getIds().size()){
            throw new BadRequestException("Tekrar eden id(ler) var.");
        }

        Set<Integer> existingIds = new HashSet<>();

        List<Project> existingProjects = projectRepository.findAllByOrderByDisplayOrderAsc();

        Map<Integer,Project> projectsById = new HashMap<>();


        for (Project project: existingProjects){
            existingIds.add(project.getId());
            projectsById.put(project.getId(), project);
        }

        if (!requestedIds.equals(existingIds)){
            throw new BadRequestException("Eksik ya da fazla id var");
        }

        for (int i = 0; i < reorderRequestDTO.getIds().size(); i++){

            Integer projectId = reorderRequestDTO.getIds().get(i);

            Project project =  projectsById.get(projectId);

            project.setDisplayOrder(i);

            projectRepository.save(project);

        }
    }

}
