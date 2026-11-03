package com.bahadiralper.portfolio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileCleanupService {

    private final FileStorageService fileStorageService;
    private final FileUsageService fileUsageService;

    @Scheduled(cron = "0 0 3 * * *")
    public void cleanup(){
        int deleted = 0;

        for (String url : fileStorageService.listFilesOlderThan(Duration.ofDays(1))) {
            if (!fileUsageService.isInUse(url)) {
                fileStorageService.delete(url);
                log.info("Sahipsiz dosya silindi: {}", url);
                deleted++;
            }
        }

        log.info("Dosya temizliği tamamlandı, silinen: {}", deleted);
    }
}


