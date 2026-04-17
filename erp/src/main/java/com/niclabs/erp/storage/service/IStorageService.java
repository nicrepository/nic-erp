package com.niclabs.erp.storage.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Contract for binary file storage operations.
 *
 * <p>Abstracting storage behind this interface allows the underlying implementation
 * to be swapped (local filesystem, Amazon S3, Google Cloud Storage) without modifying
 * any consumer — satisfying the Open/Closed Principle.</p>
 */
public interface IStorageService {

    /**
     * Persists a file and returns its generated unique filename.
     * The caller is responsible for building the public URL from the returned name.
     *
     * @param file the multipart file to store
     * @return the unique filename assigned to the stored file
     * @throws RuntimeException if the file could not be persisted
     */
    String store(MultipartFile file);

    /**
     * Loads a previously stored file as a Spring {@link Resource} for HTTP serving.
     *
     * @param fileName the unique filename previously returned by {@link #store}
     * @return the file as a loadable resource
     * @throws RuntimeException if the file does not exist or the path is malformed
     */
    Resource loadFileAsResource(String fileName);
}
