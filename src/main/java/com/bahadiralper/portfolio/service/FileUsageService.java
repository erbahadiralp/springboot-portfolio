package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class FileUsageService {

    private final FileStorageService fileStorageService;
    private final ProjectRepository projectRepository;
    private final EducationRepository educationRepository;
    private final ExperienceRepository experienceRepository;
    private final CertificateRepository certificateRepository;
    private final AboutRepository aboutRepository;

    public boolean isInUse(String url) {
        return projectRepository.existsByImageUrl(url)
                || educationRepository.existsByImageUrl(url)
                || experienceRepository.existsByImageUrl(url)
                || certificateRepository.existsByPdfUrl(url)
                || aboutRepository.existsByImageUrl(url)
                || aboutRepository.existsByCvDocumentUrlTr(url)
                || aboutRepository.existsByCvDocumentUrlEn(url);
    }


    public void deleteIfUnused(String url) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deleteNow(url);
                }
            });
        } else {
            deleteNow(url);
        }
    }

    private void deleteNow(String url) {

        if (url != null && !url.isBlank() && !isInUse(url)) {
            fileStorageService.delete(url);
        }
    }
}
