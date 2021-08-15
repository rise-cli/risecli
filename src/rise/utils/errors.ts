export class ValidationError extends Error {
    public type: string
    constructor(message: string) {
        super(message)
        this.type = 'validation'
    }
}

export class InternalError extends Error {
    public type: string
    constructor(message: string) {
        super(message)
        this.type = 'internal'
    }
}
