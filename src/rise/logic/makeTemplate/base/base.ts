import database from './base_db'
import cognito from './base_cognito'
import graphQL from './base_graphql'
import schema from './base_schema'
import apiKey from './base_apikey'
import datasource from './base_datasource_db'
import datasourceEventBridge from './base_datasource_events'
import datasourceCognito from './base_datasource_cognito'
import datasourceNone from './base_datasource_none'
import datasourceStepFunctions from './base_datasource_stepfunctions'

export default (rise: any) => {
    const db = database({
        name: rise.config.name
    })

    const cog = cognito({
        active: rise.config.auth,
        name: rise.config.name
    })

    const ql = graphQL({
        name: rise.config.name,
        auth: rise.config.auth,
        region: rise.config.region
    })

    const sc = schema({
        schema: rise.schema
    })

    const ak = apiKey()

    const ds = datasource({
        apiName: rise.config.name,
        dbName: rise.config.name,
        region: rise.config.region
    })

    const eventDs = rise.config.eventBus
        ? datasourceEventBridge({
              eventBus: rise.config.eventBus,
              region: rise.config.region,
              apiName: rise.config.name
          })
        : {
              Resources: {},
              Outputs: {}
          }

    const cognitoDs = rise.config.auth
        ? datasourceCognito({
              region: rise.config.region,
              apiName: rise.config.name
          })
        : {
              Resources: {},
              Outputs: {}
          }

    // const triggerFunction = eventBridgeTrigger({
    //     apiName: rise.config.name
    // })

    return {
        Resources: {
            ...ql.Resources,
            ...sc.Resources,
            ...ak.Resources,
            ...ds.Resources,
            ...db.Resources,
            ...eventDs.Resources,
            ...cog.Resources,
            ...cognitoDs.Resources,
            ...datasourceNone().Resources,
            ...datasourceStepFunctions({
                region: rise.config.region,
                apiName: rise.config.name
            }).Resources
        },
        Outputs: {
            ...ql.Outputs,
            ...sc.Outputs,
            ...ak.Outputs,
            ...ds.Outputs,
            ...db.Outputs,
            ...eventDs.Outputs,
            ...cog.Outputs,
            ...cognitoDs.Outputs,
            ...datasourceNone().Outputs,
            ...datasourceStepFunctions({
                region: rise.config.region,
                apiName: rise.config.name
            }).Outputs
        }
    }
}
