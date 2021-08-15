const output = (terminal: any) => ({
    clear() {
        terminal.clear()
    }
})

export function displayUnknownState(terminal: any) {
    output(terminal).clear()

    terminal.write('')
    terminal.write('Cloudformation is in an unknown state')
    terminal.write('')
}
