package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.repository.AboutRepository;
import com.bahadiralper.portfolio.repository.CertificateRepository;
import com.bahadiralper.portfolio.repository.EducationRepository;
import com.bahadiralper.portfolio.repository.ExperienceRepository;
import com.bahadiralper.portfolio.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileUsageServiceTest {

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EducationRepository educationRepository;

    @Mock
    private ExperienceRepository experienceRepository;

    @Mock
    private CertificateRepository certificateRepository;

    @Mock
    private AboutRepository aboutRepository;

    @InjectMocks
    private FileUsageService fileUsageService;

    @Test
    void isInUse_usedByProject_returnsTrue() {

        when(projectRepository.existsByImageUrl("/static/a.png")).thenReturn(true);

        assertTrue(fileUsageService.isInUse("/static/a.png"));
    }

    @Test
    void isInUse_usedOnlyByAboutEnglishCv_returnsTrue() {

        when(aboutRepository.existsByCvDocumentUrlEn("/static/cv.pdf")).thenReturn(true);

        assertTrue(fileUsageService.isInUse("/static/cv.pdf"));
    }

    @Test
    void isInUse_notUsedAnywhere_returnsFalse() {

        assertFalse(fileUsageService.isInUse("/static/a.png"));
    }


    @Test
    void deleteIfUnused_unusedFile_deletesIt() {

        fileUsageService.deleteIfUnused("/static/a.png");

        verify(fileStorageService).delete("/static/a.png");
    }

    @Test
    void deleteIfUnused_fileInUse_doesNotDelete() {

        when(projectRepository.existsByImageUrl("/static/a.png")).thenReturn(true);

        fileUsageService.deleteIfUnused("/static/a.png");

        verify(fileStorageService, never()).delete(any());
    }

    @Test
    void deleteIfUnused_nullOrBlank_doesNothing() {

        fileUsageService.deleteIfUnused(null);
        fileUsageService.deleteIfUnused("   ");

        verifyNoInteractions(fileStorageService);
    }

    @Test
    void deleteIfUnused_insideTransaction_deletesOnlyAfterCommit() {

        TransactionSynchronizationManager.initSynchronization();

        try {
            fileUsageService.deleteIfUnused("/static/a.png");

            // işlem bitmeden dosyaya dokunulmamalı
            verify(fileStorageService, never()).delete(any());

            for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }

            verify(fileStorageService).delete("/static/a.png");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}