package com.niclabs.erp.storage.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.net.MalformedURLException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class StorageService implements IStorageService {

    // Lê o caminho da pasta que configuramos no application.properties
    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    // Assim que a aplicação sobe, o Spring roda esse método para criar a pasta no seu Linux caso ela não exista
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
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Validação de segurança básica: impede que mandem caminhos maliciosos tipo "../../../arquivo"
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Nome de arquivo inválido: " + originalFileName);
            }

            // Pega a extensão original do arquivo (ex: .png, .pdf)
            String fileExtension = "";
            if (originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            // Gera um nome único e aleatório para não sobrescrever arquivos caso dois usuários subam "print.png"
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            // Copia o arquivo da memória RAM para o HD do seu computador
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