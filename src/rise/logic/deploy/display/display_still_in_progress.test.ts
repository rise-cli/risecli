import { displayStillInProgress } from './display_still_in_progress'

test('displayStillInProgress will render styled table to terminal', () => {
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

    displayStillInProgress(io.terminal)

    expect(successDisplay).toEqual([
        '',
        'Cloudformation is still deploying...',
        ''
    ])
})
