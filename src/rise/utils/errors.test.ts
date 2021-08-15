import { ValidationError, InternalError } from './errors'

test('ValidationError throws with correct type', () => {
    try {
        throw new ValidationError('Example message')
    } catch (e) {
        expect(e.type).toBe('validation')
        expect(e.message).toBe('Example message')
    }
})

test('InternalError throws with correct type', () => {
    try {
        throw new InternalError('Example message')
    } catch (e) {
        expect(e.type).toBe('internal')
        expect(e.message).toBe('Example message')
    }
})
