import { displayUnknownState } from './display_unknown_state'

test('displayUnknownState will render message', () => {
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

    displayUnknownState(io.terminal)

    expect(successDisplay).toEqual([
        '',
        'Cloudformation is in an unknown state',
        ''
    ])
})
