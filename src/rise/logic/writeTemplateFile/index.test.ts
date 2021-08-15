import { writeTemplateFile } from './index'
import input from './_test/input'
import output from './_test/output'

test('write template file will format file correctly', () => {
    const io = {
        writeFile: () => {}
    }

    const result = writeTemplateFile({
        io,
        template: input,
        ci: false
    })

    expect(result).toBe(output)
})
