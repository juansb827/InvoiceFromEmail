class DomainError extends Error {
    constructor(message) {
        super(message);
        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ResourceNotFoundError extends DomainError {
    constructor(resource, query) {
        super(`Resource ${resource} was not found.`);
        this.data = { resource, query };
    }
}

class ConnectionError extends DomainError {
    constructor(resource, query) {
        super(`Could not establish a connection to ${resource} `);
        this.data = { resource, query };
    }
}

// Errors that do not fit any of the other error types
class InternalError extends DomainError {
    constructor(error) {
        super(error.message);
        this.data = { error };
    }
}

class AppError extends Error {
    constructor(message, data, error) {        
        super(message);
        Error.captureStackTrace(this, this.constructor);        
        this.statusCode = null;                
        this.clientMessage = null;
        this.requestId = null;
        this.data = data;
        this.originalError = error;

    }
}

module.exports = {
    ResourceNotFoundError,
    InternalError,
    AppError
};