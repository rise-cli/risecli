import { displayFailDetails } from './display_fail_details'

test('displayCompletedDetails will render failed message to terminal', () => {
    let successDisplay: any[] = []
    const io = {
        terminal: {
            write: (x: any) => {
                successDisplay.push(x)
            },
            clear: () => {
                successDisplay = []
            }
        }
    }

    const details = {
        message: 'my message'
    }

    displayFailDetails(io.terminal, details)

    expect(successDisplay).toEqual([
        '',
        'There was an issue deploying your app',
        'Error: my message'
    ])
})
