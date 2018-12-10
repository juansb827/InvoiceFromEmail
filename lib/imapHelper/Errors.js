class DomainError extends Error {
    constructor(message) {
        super(message);
        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthenticationError extends DomainError {
    constructor(message) {
        super(`Could not authenticate: ${message} `);
        this.data = { message };
    }
}

class ConnectionError extends DomainError {
    constructor(message) {
        super(`Could not establish a connection: ${message} `);
        this.data = { message };
    }
}

// Errors that do not fit any of the other error types
class InternalError extends DomainError {
    constructor(error) {
        super(error.message);
        this.data = { error };
    }
}

module.exports = {
    AuthenticationError,
    InternalError,
    ConnectionError
};