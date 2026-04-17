package com.niclabs.erp.storage.controller;

import com.niclabs.erp.storage.service.IStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * REST controller for serving stored files (images, PDFs, and other binary content).
 *
 * <p>Files are served inline with the appropriate content type so that browsers can
 * display images directly rather than triggering a download.</p>
 */
@Slf4j
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final IStorageService storageService;

    /**
     * Serves a previously uploaded file as an HTTP resource with its detected content type.
     *
     * <p>The file is sent with an {@code inline} disposition so browsers attempt to display
     * it directly (e.g. images open in the current tab rather than downloading).</p>
     *
     * @param fileName the unique filename returned by the storage service at upload time
     * @param request  the servlet request used to detect the file's MIME type
     * @return 200 OK with the file content and appropriate {@code Content-Type} header
     */
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {

        Resource resource = storageService.loadFileAsResource(fileName);

        // Tenta descobrir o tipo do arquivo (PNG, JPG, PDF) para o navegador saber como exibir
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            log.warn("Não foi possível determinar o tipo do arquivo: {}", fileName);
        }

        // Se não conseguir descobrir, define como um binário genérico
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                // O "inline" diz para o navegador tentar abrir a imagem na própria aba em vez de baixar o arquivo
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
