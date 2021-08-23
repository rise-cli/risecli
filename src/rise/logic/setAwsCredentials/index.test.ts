import { setAWSCredentials } from './index'

test('getCredentials will return AWS from env variables and default region', () => {
    process.env.AWS_SECRET_ACCESS_KEY = 'test_secret'
    process.env.AWS_ACCESS_KEY_ID = 'test_key'

    const io = {
        setConfig: jest.fn(),
        setCredentials: jest.fn()
    }

    const result = setAWSCredentials({ io, AWS: 'MOCK' })

    expect(result).toBe('MOCK')
    expect(io.setConfig).toHaveBeenCalledWith({
        AWS: 'MOCK',
        key: 'test_secret',
        secret: 'test_secret',
        region: 'us-east-1'
    })
})

test('getCredentials will return AWS from env variables and block defined region', () => {
    process.env.AWS_SECRET_ACCESS_KEY = 'test_secret'
    process.env.AWS_ACCESS_KEY_ID = 'test_key'

    const io = {
        setConfig: jest.fn(),
        setCredentials: jest.fn()
    }

    const result = setAWSCredentials({
        io,
        AWS: 'MOCK',
        region: 'us-east-2'
    })
    expect(result).toBe('MOCK')
    expect(io.setConfig).toHaveBeenCalledWith({
        AWS: 'MOCK',
        key: 'test_secret',
        secret: 'test_secret',
        region: 'us-east-2'
    })
})

test('getCredentials will return AWS with credentials from local computer', () => {
    delete process.env.AWS_SECRET_ACCESS_KEY
    delete process.env.AWS_ACCESS_KEY_ID

    const io = {
        setConfig: jest.fn(),
        setCredentials: jest.fn()
    }

    const result = setAWSCredentials({
        io,
        AWS: 'MOCK',
        region: 'us-east-2'
    })
    expect(result).toBe('MOCK')
    expect(io.setCredentials).toHaveBeenCalledWith({
        AWS: 'MOCK',
        profile: false,
        region: 'us-east-2'
    })
})

test('getCredentials will throw error if ini does not work', () => {
    delete process.env.AWS_SECRET_ACCESS_KEY
    delete process.env.AWS_ACCESS_KEY_ID
    const io = {
        setConfig: jest.fn(),
        setCredentials: jest.fn(() => {
            throw new Error('Forced Error')
        })
    }

    try {
        setAWSCredentials({
            io,
            AWS: 'MOCK',
            region: 'us-east-2'
        })
    } catch (e) {
        expect(e.message).toBe(
            'There was an issue reading your local AWS credentials from your credentials file. Learn more about configuring your credentails here:\n\nhttps://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html'
        )
    }
})
