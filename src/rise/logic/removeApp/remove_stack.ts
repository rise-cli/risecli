type RemoveDeploymentInput = {
    io: any
    name: string
}

export async function removeDeployment({
    io,
    name
}: RemoveDeploymentInput): Promise<string> {
    try {
        await io.remove({ name })
        return 'REMOVING'
    } catch (e) {
        throw new Error(e)
    }
}
