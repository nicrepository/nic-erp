package com.niclabs.erp.storage.service;

import com.niclabs.erp.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.net.MalformedURLException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService implements IStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    // A08: Allowed MIME types for uploaded files
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"
    );

    // A08: Magic byte signatures for file type verification (prevents content-type spoofing)
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg",       new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF},
            "image/png",        new byte[]{(byte)0x89, 0x50, 0x4E, 0x47},
            "image/gif",        new byte[]{0x47, 0x49, 0x46, 0x38},
            "application/pdf",  new byte[]{0x25, 0x50, 0x44, 0x46}
    );

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Não foi possível criar a pasta onde os arquivos serão armazenados.", ex);
        }
    }

    public String store(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload"
        );

        try {
            if (originalFileName.contains("..")) {
                throw new BusinessException("Nome de arquivo inválido: " + originalFileName);
            }

            // A08: Validate declared MIME type against whitelist
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
                throw new BusinessException("Tipo de arquivo não permitido. Envie imagens (JPEG, PNG, GIF, WebP) ou PDF.");
            }

            // A08: Validate magic bytes to prevent content-type spoofing (skip for WebP — complex RIFF header)
            if (MAGIC_BYTES.containsKey(contentType)) {
                byte[] expected = MAGIC_BYTES.get(contentType);
                byte[] header = new byte[expected.length];
                try (InputStream is = file.getInputStream()) {
                    int read = is.read(header, 0, expected.length);
                    if (read < expected.length || !Arrays.equals(header, expected)) {
                        throw new BusinessException("O conteúdo do arquivo não corresponde ao tipo declarado.");
                    }
                }
            }

            String fileExtension = "";
            if (originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String newFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Não foi possível armazenar o arquivo " + originalFileName, ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Arquivo não encontrado: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Arquivo não encontrado: " + fileName, ex);
        }
    }
}