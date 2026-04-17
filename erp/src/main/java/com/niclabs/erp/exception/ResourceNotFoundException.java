package com.niclabs.erp.exception;

public class ResourceNotFoundException extends ApplicationException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " com id '" + id + "' não encontrado.");
    }
}
