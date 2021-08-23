export async function startDeployment(props: {
    io: any
    name: string
    template: string
}): Promise<string> {
    try {
        await props.io.update({ template: props.template, name: props.name })
        return 'UPDATING'
    } catch (e) {
        if (e.message === `Stack [${props.name}] does not exist`) {
            await props.io.create({
                template: props.template,
                name: props.name
            })
            return 'CREATING'
        } else if (e.message === 'No updates are to be performed.') {
            return 'NOTHING'
        } else {
            throw new Error(e)
        }
    }
}
