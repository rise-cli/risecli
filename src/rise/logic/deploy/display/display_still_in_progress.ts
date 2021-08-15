type Input = {
    message: string
}

const output = (terminal: any) => ({
    clear() {
        terminal.clear()
    }
})

export function displayStillInProgress(terminal: any) {
    output(terminal).clear()

    terminal.write('')
    terminal.write('Cloudformation is still deploying...')
    terminal.write('')
}
