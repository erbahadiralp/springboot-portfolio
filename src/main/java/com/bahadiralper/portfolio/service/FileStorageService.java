package com.bahadiralper.portfolio.service;

import com.bahadiralper.portfolio.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp", "pdf");

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    public String store(MultipartFile file){

        if (file.isEmpty()){
            throw new BadRequestException("Dosya boş");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || !originalName.contains(".")){
            throw new BadRequestException("Dosya adı geçersiz");
        }

        int indexOfDot = originalName.lastIndexOf('.');

        String extension = originalName.substring(indexOfDot + 1).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)){
            throw new BadRequestException("Bu dosya türüne izin verilmiyor.");

        }

        long fileSize = file.getSize();

        if (!extension.equals("pdf") && fileSize > MAX_IMAGE_SIZE){
            throw new BadRequestException("Görsel en fazla 5 MB olabilir");
        }


        byte[] header;

        try {
            header = file.getInputStream().readNBytes(12);
        } catch (IOException e) {
            throw new RuntimeException("Dosya okunamadı", e);
        }

        if (!matchesSignature(header, extension)) {
            throw new BadRequestException("Dosya içeriği uzantısıyla uyuşmuyor");
        }

        String storedName = UUID.randomUUID() + "." +extension;


        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName);
            Files.copy(file.getInputStream(), target);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return "/static/" + storedName;



    }

    private boolean matchesSignature(byte[] header, String extension){

        switch (extension) {
            case "png":
                return header.length >= 4
                        && header[0] == (byte) 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G';
            case "jpg":
            case "jpeg":
                return header.length >= 3
                        && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF;
            case "pdf":
                return header.length >= 4
                        && header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F';
            case "webp":
                return header.length >= 12
                        && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                        && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            default:
                return false;
        }
    }

    public void delete(String url){

        if (url == null || !url.startsWith("/static/")){
            return;
        }

        String newUrl = url.substring("/static/".length());

        Path base = Path.of(uploadDir).toAbsolutePath().normalize();
        Path target = base.resolve(newUrl).normalize();


        if (!target.startsWith(base) || target.equals(base)){
            return;
        }

        try{
            Files.deleteIfExists(target);

        } catch (IOException e) {
            // dosya silinemezse isteği bozma
        }
    }

    public List<String> listFilesOlderThan(Duration minAge) {
        Path base = Path.of(uploadDir).toAbsolutePath().normalize();
        Instant limit = Instant.now().minus(minAge);

        try (Stream<Path> files = Files.list(base)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toInstant().isBefore(limit);
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .map(path -> "/static/" + path.getFileName().toString())
                    .toList();
        } catch (IOException e) {
            return List.of();
        }
    }
}
