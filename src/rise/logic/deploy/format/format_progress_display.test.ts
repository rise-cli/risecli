import { formatProgressDisplay } from './format_progress_display'

test('displayProgress will display table with lined up spacing', () => {
    const input = {
        StackResources: [
            {
                LogicalResourceId: 'AppSyncId',
                ResourceStatus: 'UPDATING'
            },
            {
                LogicalResourceId: 'Cognito Pool Client Id',
                ResourceStatus: 'UPDATING'
            },
            {
                LogicalResourceId: 'Db',
                ResourceStatus: 'COMPLETE'
            }
        ]
    }

    const result = formatProgressDisplay(input)

    expect(result).toEqual([
        { Resource: 'Resource                 ', Status: 'Status' },
        { Resource: 'AppSyncId                ', Status: 'UPDATING' },
        { Resource: 'Cognito Pool Client Id   ', Status: 'UPDATING' },
        { Resource: 'Db                       ', Status: 'COMPLETE' }
    ])
})
