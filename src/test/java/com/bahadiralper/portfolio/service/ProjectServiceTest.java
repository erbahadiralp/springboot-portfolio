package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.dto.ProjectRequestDTO;
import com.bahadiralper.portfolio.dto.ProjectResponseDTO;
import com.bahadiralper.portfolio.dto.ReorderRequestDTO;
import com.bahadiralper.portfolio.entity.Project;
import com.bahadiralper.portfolio.exception.BadRequestException;
import com.bahadiralper.portfolio.exception.ResourceNotFoundException;
import com.bahadiralper.portfolio.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private FileUsageService fileUsageService;

    @InjectMocks
    private ProjectService projectService;


    private Project createProject(Integer id, String imageUrl, int displayOrder) {
        Project project = new Project();

        project.setId(id);
        project.setTitleTr("Başlık TR " + id);
        project.setTitleEn("Title EN " + id);
        project.setDescriptionTr("Açıklama TR");
        project.setDescriptionEn("Description EN");
        project.setTools("Java, Spring");
        project.setLink("https://github.com/test");
        project.setDemoUrl("https://demo.test");
        project.setImageUrl(imageUrl);
        project.setDisplayOrder(displayOrder);

        return project;
    }

    private ProjectRequestDTO createRequest(String imageUrl) {
        ProjectRequestDTO requestDTO = new ProjectRequestDTO();

        requestDTO.setTitleTr("Yeni Başlık TR");
        requestDTO.setTitleEn("New Title EN");
        requestDTO.setDescriptionTr("Yeni Açıklama TR");
        requestDTO.setDescriptionEn("New Description EN");
        requestDTO.setTools("Kotlin");
        requestDTO.setLink("https://github.com/yeni");
        requestDTO.setDemoUrl("https://yeni.demo");
        requestDTO.setImageUrl(imageUrl);

        return requestDTO;
    }


    @Test
    void getAll_returnsAllProjectsAsResponse() {

        Project project1 = createProject(1, "/static/a.png", 0);
        Project project2 = createProject(2, "/static/b.png", 1);

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(project1, project2));

        List<ProjectResponseDTO> result = projectService.getAll();

        assertEquals(2, result.size());
        assertEquals(1, result.get(0).getId());
        assertEquals(2, result.get(1).getId());
        assertEquals("/static/a.png", result.get(0).getImageUrl());
        assertEquals(1, result.get(1).getDisplayOrder());
    }

    @Test
    void getById_existingId_returnsProject() {

        Project project = createProject(1, "/static/a.png", 0);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project));

        ProjectResponseDTO result = projectService.getById(1);

        assertEquals(1, result.getId());
        assertEquals("Başlık TR 1", result.getTitleTr());
    }

    @Test
    void getById_missingId_throwsNotFound() {

        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.getById(99));
    }

    @Test
    void create_noProjects_setsDisplayOrderZero() {

        ProjectRequestDTO requestDTO = createRequest("/static/a.png");

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of());
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponseDTO result = projectService.create(requestDTO);

        assertEquals(0, result.getDisplayOrder());
        assertEquals("Yeni Başlık TR", result.getTitleTr());
    }

    @Test
    void create_existingProjects_setsDisplayOrderLastPlusOne() {

        ProjectRequestDTO requestDTO = createRequest("/static/a.png");

        Project last = createProject(1, "/static/x.png", 4);

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(last));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponseDTO result = projectService.create(requestDTO);

        assertEquals(5, result.getDisplayOrder());
    }

    @Test
    void update_existingId_updatesFieldsAndKeepsDisplayOrder() {

        Project project = createProject(1, "/static/eski.png", 3);
        ProjectRequestDTO requestDTO = createRequest("/static/yeni.png");

        when(projectRepository.findById(1)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectResponseDTO result = projectService.update(1, requestDTO);

        assertEquals(1, result.getId());
        assertEquals("Yeni Başlık TR", result.getTitleTr());
        assertEquals("/static/yeni.png", result.getImageUrl());
        assertEquals(3, result.getDisplayOrder());
    }

    @Test
    void update_imageChanged_deletesOldFile() {

        Project project = createProject(1, "/static/eski.png", 0);
        ProjectRequestDTO requestDTO = createRequest("/static/yeni.png");

        when(projectRepository.findById(1)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        projectService.update(1, requestDTO);

        verify(fileUsageService).deleteIfUnused("/static/eski.png");
    }

    @Test
    void update_imageSame_doesNotDeleteFile() {

        Project project = createProject(1, "/static/ayni.png", 0);
        ProjectRequestDTO requestDTO = createRequest("/static/ayni.png");

        when(projectRepository.findById(1)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        projectService.update(1, requestDTO);

        verify(fileUsageService, never()).deleteIfUnused(any());
    }

    @Test
    void update_missingId_throwsNotFoundAndTouchesNothing() {

        ProjectRequestDTO requestDTO = createRequest("/static/yeni.png");

        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.update(99, requestDTO));

        verify(projectRepository, never()).save(any(Project.class));
        verifyNoInteractions(fileUsageService);
    }

    @Test
    void delete_existingId_deletesProjectThenFile() {

        Project project = createProject(1, "/static/a.png", 0);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project));

        projectService.delete(1);

        // sıra önemli: önce kayıt silinir, sonra dosya
        InOrder inOrder = inOrder(projectRepository, fileUsageService);
        inOrder.verify(projectRepository).delete(project);
        inOrder.verify(fileUsageService).deleteIfUnused("/static/a.png");
    }

    @Test
    void delete_missingId_throwsNotFoundAndDeletesNothing() {

        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.delete(99));

        verify(projectRepository, never()).delete(any(Project.class));
        verifyNoInteractions(fileUsageService);
    }


    @Test
    void reorder_duplicateIds_throwsBadRequest() {

        ReorderRequestDTO reorderRequestDTO = new ReorderRequestDTO();
        reorderRequestDTO.setIds(List.of(1, 1, 2));

        assertThrows(BadRequestException.class, () -> projectService.reorder(reorderRequestDTO));
    }

    @Test
    void reorder_missingIds_throwsBadRequest() {

        Project project1 = createProject(1, null, 0);
        Project project2 = createProject(2, null, 1);

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(project1, project2));

        ReorderRequestDTO reorderRequestDTO = new ReorderRequestDTO();
        reorderRequestDTO.setIds(List.of(1, 3));

        assertThrows(BadRequestException.class, () -> projectService.reorder(reorderRequestDTO));
    }

    @Test
    void reorder_extraIds_throwsBadRequest() {

        Project project1 = createProject(1, null, 0);
        Project project2 = createProject(2, null, 1);

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(project1, project2));

        ReorderRequestDTO reorderRequestDTO = new ReorderRequestDTO();
        reorderRequestDTO.setIds(List.of(1, 2, 3));

        assertThrows(BadRequestException.class, () -> projectService.reorder(reorderRequestDTO));
    }

    @Test
    void reorder_validIds_setsDisplayOrder() {

        Project project1 = createProject(1, null, 0);
        Project project2 = createProject(2, null, 1);

        when(projectRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(project1, project2));

        ReorderRequestDTO reorderRequestDTO = new ReorderRequestDTO();
        reorderRequestDTO.setIds(List.of(2, 1));

        projectService.reorder(reorderRequestDTO);

        assertEquals(0, project2.getDisplayOrder());
        assertEquals(1, project1.getDisplayOrder());
    }
}