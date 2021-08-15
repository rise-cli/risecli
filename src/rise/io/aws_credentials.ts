export function setConfig(props: {
    AWS: any
    key: string
    secret: string
    region: string
}) {
    props.AWS.config.update({
        accessKeyId: props.key,
        secretAccessKey: props.secret,
        region: props.region
    })

    return props.AWS
}

export function setCredentials(props: {
    AWS: any
    profile: string
    region: string
}) {
    const credentials = new props.AWS.SharedIniFileCredentials({
        profile: props.profile
    })

    props.AWS.config.credentials = credentials
    props.AWS.config.region = props.region
    return props.AWS
}
