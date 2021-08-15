export async function startDeployment(
    io: any,
    name: string,
    template: string
): Promise<string> {
    try {
        await io.update({ template, name })
        return 'UPDATING'
    } catch (e) {
        if (e.message === `Stack [${name}] does not exist`) {
            await io.create({ template, name })
            return 'CREATING'
        } else if (e.message === 'No updates are to be performed.') {
            return 'NOTHING'
        } else {
            throw new Error(e)
        }
    }
}
