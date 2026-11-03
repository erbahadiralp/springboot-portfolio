package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    private static final byte[] PNG_BYTES = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0
    };

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService();
        ReflectionTestUtils.setField(fileStorageService, "uploadDir", tempDir.toString());
    }

    @Test
    void store_validPng_savesFileAndReturnsStaticUrl() {

        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", PNG_BYTES);

        String url = fileStorageService.store(file);

        assertTrue(url.startsWith("/static/"));
        assertTrue(url.endsWith(".png"));
        assertTrue(Files.exists(tempDir.resolve(url.substring("/static/".length()))));
    }

    @Test
    void store_validPdf_savesFile() {

        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        String url = fileStorageService.store(file);

        assertTrue(url.endsWith(".pdf"));
        assertTrue(Files.exists(tempDir.resolve(url.substring("/static/".length()))));
    }

    @Test
    void store_emptyFile_throwsBadRequest() {

        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", new byte[0]);

        assertThrows(BadRequestException.class, () -> fileStorageService.store(file));
    }

    @Test
    void store_noExtension_throwsBadRequest() {

        MockMultipartFile file = new MockMultipartFile("file", "foto", "image/png", PNG_BYTES);

        assertThrows(BadRequestException.class, () -> fileStorageService.store(file));
    }

    @Test
    void store_disallowedExtension_throwsBadRequest() {

        MockMultipartFile file = new MockMultipartFile("file", "virus.exe", "application/octet-stream", PNG_BYTES);

        assertThrows(BadRequestException.class, () -> fileStorageService.store(file));
    }

    @Test
    void store_fakePng_throwsBadRequest() {

        MockMultipartFile file = new MockMultipartFile("file", "foto.png", "image/png", "bu bir yazi dosyasi".getBytes());

        assertThrows(BadRequestException.class, () -> fileStorageService.store(file));
    }

    @Test
    void store_imageOver5MB_throwsBadRequestAndWritesNothing() throws IOException {

        byte[] bigPng = new byte[5 * 1024 * 1024 + 1];
        bigPng[0] = (byte) 0x89;
        bigPng[1] = 'P';
        bigPng[2] = 'N';
        bigPng[3] = 'G';

        MockMultipartFile file = new MockMultipartFile("file", "buyuk.png", "image/png", bigPng);

        assertThrows(BadRequestException.class, () -> fileStorageService.store(file));

        try (Stream<Path> files = Files.list(tempDir)) {
            assertEquals(0L, files.count());
        }
    }

    @Test
    void delete_existingFile_deletesIt() throws IOException {

        Path file = tempDir.resolve("abc.png");
        Files.write(file, PNG_BYTES);

        fileStorageService.delete("/static/abc.png");

        assertTrue(Files.notExists(file));
    }

    @Test
    void delete_nonStaticUrlOrNull_doesNothing() throws IOException {

        Path file = tempDir.resolve("abc.png");
        Files.write(file, PNG_BYTES);

        fileStorageService.delete("https://baska-site.com/abc.png");
        fileStorageService.delete(null);

        assertTrue(Files.exists(file));
    }

    @Test
    void delete_pathTraversal_doesNotDeleteFileOutsideUploads() throws IOException {

        Path uploads = tempDir.resolve("uploads");
        Files.createDirectories(uploads);
        Path outside = tempDir.resolve("secret.txt");
        Files.writeString(outside, "gizli");

        ReflectionTestUtils.setField(fileStorageService, "uploadDir", uploads.toString());

        fileStorageService.delete("/static/../secret.txt");

        assertTrue(Files.exists(outside));
    }

    @Test
    void delete_staticRootOnly_doesNotDeleteUploadsDirectory() {

        fileStorageService.delete("/static/");

        assertTrue(Files.exists(tempDir));
    }

    @Test
    void delete_missingFile_doesNotThrow() {

        assertDoesNotThrow(() -> fileStorageService.delete("/static/yok.png"));
    }
}