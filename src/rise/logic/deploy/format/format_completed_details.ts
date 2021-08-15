type Output = {
    OutputKey: string
    OutputValue: string
}

function getOutput(outputs: Output[], value: string) {
    const v = outputs.find((x) => x.OutputKey === value)
    return v ? v.OutputValue : false
}

function getRegion(outputs: Output[]) {
    const appsyncFullId = outputs.find((x) => x.OutputKey === 'AppsyncId')
    return appsyncFullId?.OutputValue.split(':')[3] || false
}

function getAppSyncId(outputs: Output[]) {
    const appsyncFullId = outputs.find((x) => x.OutputKey === 'AppsyncId')
    return appsyncFullId?.OutputValue.split(':')[5].split('/')[1] || false
}

export function formatCompletedDetails(result: any) {
    const outputs: Output[] = result.outputs

    return {
        status: 'success',
        message: 'success',
        url: getOutput(outputs, 'ApiUrl'),
        apiKey: getOutput(outputs, 'ApiKey'),
        userPoolId: getOutput(outputs, 'UserPoolId'),
        userPoolClientId: getOutput(outputs, 'UserPoolClientId'),
        eventBridgeArn: getOutput(outputs, 'EventBridgeArn'),
        region: getRegion(outputs),
        appsyncId: getAppSyncId(outputs)
    }
}
