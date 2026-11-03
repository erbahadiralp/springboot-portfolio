package com.bahadiralper.portfolio.controller;

import com.bahadiralper.portfolio.dto.FileUploadResponseDTO;
import com.bahadiralper.portfolio.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<FileUploadResponseDTO> store(@RequestParam("file")MultipartFile file){

        String fileUpload = fileStorageService.store(file);

        FileUploadResponseDTO responseDTO = new FileUploadResponseDTO();
        responseDTO.setUrl(fileUpload);
        responseDTO.setOriginalFileName(file.getOriginalFilename());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);

    }

}
