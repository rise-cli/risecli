export function formatProgressDisplay(x: any) {
    let maxWidth = 0
    return x.StackResources.map((x: any) => {
        if (x.LogicalResourceId.length > maxWidth) {
            maxWidth = x.LogicalResourceId.length
        }
        return x
    })
        .map((x: any) => {
            let name = ''
            for (let index = 0; index < maxWidth + 3; index++) {
                if (x.LogicalResourceId[index]) {
                    name = name + x.LogicalResourceId[index]
                } else {
                    name = name + ' '
                }
            }
            return {
                Resource: name,
                Status: x.ResourceStatus
            }
        })
        .reduce((acc: any, x: any, i: number) => {
            if (i === 0) {
                let resourceTitle = 'Resource'
                let resourceTitlePadding = ''
                for (let index = 0; index < maxWidth + 3; index++) {
                    if (resourceTitle[index]) {
                        resourceTitlePadding =
                            resourceTitlePadding + resourceTitle[index]
                    } else {
                        resourceTitlePadding = resourceTitlePadding + ' '
                    }
                }

                acc.push({
                    Resource: resourceTitlePadding,
                    Status: 'Status'
                })
            }
            acc.push(x)
            return acc
        }, [])
}
