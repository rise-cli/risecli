import { displayProgressDetails } from './display_progress_details'

test('displayProgressDetails will render styled table to terminal', () => {
    let progressDisplay: any[] = []
    const io = {
        terminal: {
            write: (x: any) => {
                progressDisplay.push(x)
            },
            clear: () => {
                progressDisplay = []
            }
        }
    }

    const details = [
        { Resource: 'Resource                 ', Status: 'Status' },
        { Resource: 'AppSyncId                ', Status: 'UPDATING' },
        { Resource: 'Cognito Pool Client Id   ', Status: 'UPDATING' },
        { Resource: 'Db                       ', Status: 'COMPLETE' }
    ]

    displayProgressDetails(io, details)

    if (process.env.CI) {
        expect(progressDisplay[0].includes('Resource')).toBeTruthy()
        expect(progressDisplay[0].includes('Status')).toBeTruthy()

        expect(progressDisplay[1].includes('AppSyncId')).toBeTruthy()
        expect(progressDisplay[1].includes('UPDATING')).toBeTruthy()

        expect(
            progressDisplay[2].includes('Cognito Pool Client Id')
        ).toBeTruthy()
        expect(progressDisplay[2].includes('UPDATING')).toBeTruthy()

        expect(progressDisplay[3].includes('Db')).toBeTruthy()
        expect(progressDisplay[3].includes('COMPLETE')).toBeTruthy()
    } else {
        expect(progressDisplay).toEqual([
            '\x1B[90m\x1B[1mResource                 \x1B[22m\x1B[39m | \x1B[90m\x1B[1mStatus\x1B[22m\x1B[39m',
            '\x1B[90mAppSyncId                \x1B[39m | \x1B[34mUPDATING\x1B[39m',
            '\x1B[90mCognito Pool Client Id   \x1B[39m | \x1B[34mUPDATING\x1B[39m',
            '\x1B[90mDb                       \x1B[39m | \x1B[32mCOMPLETE\x1B[39m'
        ])
    }
})
