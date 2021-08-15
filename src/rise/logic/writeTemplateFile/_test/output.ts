export default `Resources:
  GraphQlApi:
    Type: AWS::AppSync::GraphQLApi
    Properties:
      Name: example2
      XrayEnabled: false
      AuthenticationType: API_KEY
      AdditionalAuthenticationProviders:
        - AuthenticationType: AWS_IAM
  GraphQlSchema:
    Type: AWS::AppSync::GraphQLSchema
    Properties:
      Definition: | 
        type Note {
          pk: String
          sk: String
          name: String
        }
        
        input NoteInput {
          pk: String
          sk: String
          name: String
        }
        
        type Query {
          notes: [Note]
        }
        
        input TestingInput {
          id: String
        }
        
        type Mutation {
          createNote(input: NoteInput): Note
          removeNote(pk: String, sk: String): Note
        }
        
        schema {
          query: Query
          mutation: Mutation
        }
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
  GraphQlApiKeyDefault:
    Type: AWS::AppSync::ApiKey
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      Expires: 1627859769
  DbDatasource:
    Type: AWS::AppSync::DataSource
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      Name: DbDatasource
      Type: AMAZON_DYNAMODB
      DynamoDBConfig:
        TableName: example2
        AwsRegion: us-east-2
      ServiceRoleArn:
        Fn::GetAtt:
          - DbDatasourceRole
          - Arn
  DbDatasourceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: example2-dynamodb-policy
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action:
              - sts:AssumeRole
            Principal:
              Service:
                - appsync.amazonaws.com
      Policies:
        - PolicyName: example2PolicyDynamoDB
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:*
                Resource:
                  - Fn::Sub:
                      - arn:aws:dynamodb:\${AWS::Region}:\${AWS::AccountId}:table/example2
                      - {}
  Database:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: example2
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
        - AttributeName: pk2
          AttributeType: S
        - AttributeName: pk3
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: pk2
          KeySchema:
            - AttributeName: pk2
              KeyType: HASH
            - AttributeName: sk
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: pk3
          KeySchema:
            - AttributeName: pk3
              KeyType: HASH
            - AttributeName: sk
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      BillingMode: PAY_PER_REQUEST
  EventBridgeDataSource:
    Type: AWS::AppSync::DataSource
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      Name: EventBridgeDataSource
      Type: HTTP
      HttpConfig:
        AuthorizationConfig:
          AuthorizationType: AWS_IAM
          AwsIamConfig:
            SigningRegion: us-east-2
            SigningServiceName: events
        Endpoint: https://events.us-east-2.amazonaws.com/
      ServiceRoleArn:
        Fn::GetAtt:
          - EventDatasourceRole
          - Arn
  EventDatasourceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: example2-eventds-policy
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action:
              - sts:AssumeRole
            Principal:
              Service:
                - appsync.amazonaws.com
      Policies:
        - PolicyName: example2PolicyEventDS
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action:
                  - events:Put*
                Resource:
                  - Fn::Sub:
                      - arn:aws:events:\${AWS::Region}:\${AWS::AccountId}:event-bus/default
                      - {}
  FunctionQuery:
    Type: AWS::AppSync::FunctionConfiguration
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      DataSourceName: DbDatasource
      FunctionVersion: "2018-05-29"
      Name: functionQuery
      RequestMappingTemplate: | 
                {
                  "version": "2017-02-28",
                  "operation" : "Query",
                    "query" : {
                        "expression" : "pk = :pk AND begins_with(sk, :sk)",
                        "expressionValues" : {
                            ":pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            ":sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }
                }
      ResponseMappingTemplate: | 
                    $util.qr($ctx.stash.put("dbresult", $ctx.result.items))
                    $util.toJson($ctx.result.items)
                
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  PipelineQuerynotes:
    Type: AWS::AppSync::Resolver
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      FieldName: notes
      Kind: PIPELINE
      PipelineConfig:
        Functions:
          - Fn::GetAtt:
              - FunctionQuery
              - FunctionId
      RequestMappingTemplate: | 
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    
             {}
      ResponseMappingTemplate: | 
            #if($ctx.stash.dbresult)
                $util.toJson($ctx.stash.dbresult)
                
            #else
                $util.error("event branch")
                $ctx.stash.eventresult
            #end
                
      TypeName: Query
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  FunctionSet:
    Type: AWS::AppSync::FunctionConfiguration
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      DataSourceName: DbDatasource
      FunctionVersion: "2018-05-29"
      Name: functionSet
      RequestMappingTemplate: | 
                    {
                        "version": "2017-02-28",
                        "operation": "PutItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        },
                        "attributeValues": $util.dynamodb.toMapValuesJson($context.stash.input)
                    }
      ResponseMappingTemplate: | 
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  PipelineMutationcreateNote:
    Type: AWS::AppSync::Resolver
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      FieldName: createNote
      Kind: PIPELINE
      PipelineConfig:
        Functions:
          - Fn::GetAtt:
              - FunctionSet
              - FunctionId
      RequestMappingTemplate: | 
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
               $util.qr($ctx.stash.input.put("sk", $util.str.toReplace("note_@id", "@id", $util.autoId())))            $util.qr($ctx.stash.input.put("other", "sub")) 
             {}
      ResponseMappingTemplate: | 
                #if($ctx.stash.dbresult)
                  $util.toJson($ctx.stash.dbresult)   
                #else
                    $util.toJson($ctx.args)
                    ## $ctx.stash.eventresult
                #end
                
      TypeName: Mutation
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  FunctionRemove:
    Type: AWS::AppSync::FunctionConfiguration
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      DataSourceName: DbDatasource
      FunctionVersion: "2018-05-29"
      Name: functionRemove
      RequestMappingTemplate: | 
                    {
                        "version": "2017-02-28",
                        "operation": "DeleteItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }
      ResponseMappingTemplate: | 
                       $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  PipelineMutationremoveNote:
    Type: AWS::AppSync::Resolver
    Properties:
      ApiId:
        Fn::GetAtt:
          - GraphQlApi
          - ApiId
      FieldName: removeNote
      Kind: PIPELINE
      PipelineConfig:
        Functions:
          - Fn::GetAtt:
              - FunctionRemove
              - FunctionId
      RequestMappingTemplate: | 
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    
             {}
      ResponseMappingTemplate: | 
                #if($ctx.stash.dbresult)
                  $util.toJson($ctx.stash.dbresult)   
                #else
                    $util.toJson($ctx.args)
                    ## $ctx.stash.eventresult
                #end
                
      TypeName: Mutation
    DependsOn:
      - DbDatasource
      - GraphQlSchema
  TriggerSubscriptionFunctionexample2processCompleteda:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: nodejs12.x
      Handler: index.handler
      Role:
        Fn::GetAtt:
          - TriggerSubscriptionRoleexample2processCompleteda
          - Arn
      Code:
        ZipFile: | 
            const env = require("process").env;
            const AWS = require("aws-sdk");
            const URL = require("url");
            const https = require('https');

            AWS.config.update({
            region: process.env.REGION,
            credentials: new AWS.Credentials(
                env.AWS_ACCESS_KEY_ID,
                env.AWS_SECRET_ACCESS_KEY,
                env.AWS_SESSION_TOKEN
            ),
            });

            module.exports.handler = (props) => {
                //const input = JSON.parse(props)
                const body = {
                    query: \`
                        mutation createNote($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    \`,
                    variables: {
                        input: {pk: props.detail.pk,sk: props.detail.sk,status: props.detail.status}
                    }
                }
                const uri = URL.parse(process.env.ENDPOINT);
                const httpRequest = new AWS.HttpRequest(uri.href, process.env.REGION);
                httpRequest.headers.host = uri.host;
                httpRequest.headers["Content-Type"] = "application/json";
                httpRequest.method = "POST";
                httpRequest.body = JSON.stringify(body);

                const signer = new AWS.Signers.V4(httpRequest, "appsync", true);
                signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

                const options = {
                    hostname: uri.href.slice(8, uri.href.length - 8),
                    path: '/graphql',
                    method: httpRequest.method,
                    body: httpRequest.body,
                    headers: httpRequest.headers,
                };

                const req = https.request(options, res => {

                res.on('data', d => {
                        process.stdout.write(d)
                    })
                })

                req.on('error', error => {
                    console.error(error.message)
                })

                req.write(JSON.stringify(body))
                req.end()
            }
      Environment:
        Variables:
          REGION:
            Fn::Sub:
              - \${AWS::Region}
              - {}
          ENDPOINT:
            Fn::GetAtt:
              - GraphQlApi
              - GraphQLUrl
  TriggerSubscriptionRoleexample2processCompleteda:
    Type: AWS::IAM::Role
    Properties:
      RoleName: TriggerSubscriptionRoleexample2processCompleteda
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action:
              - sts:AssumeRole
            Principal:
              Service:
                - lambda.amazonaws.com
      Policies:
        - PolicyName: TriggerSubscriptionPolicyexample2
          PolicyDocument:
            Version: 2012-10-17
            Statement:
              - Effect: Allow
                Action:
                  - appsync:GraphQL
                Resource:
                  - Fn::Join:
                      - ""
                      -
                        - Fn::GetAtt:
                            - GraphQlApi
                            - Arn
                        - /types/*
  EventListenerexample2processCompleteda:
    Type: AWS::Events::Rule
    Properties:
      EventBusName: default
      EventPattern:
        source:
          - custom.accounting
        detail-type:
          - processCompleted
      Targets:
        - Arn:
            Fn::GetAtt:
              - TriggerSubscriptionFunctionexample2processCompleteda
              - Arn
          Id: EventListenerexample2processCompleteda
  EventRuleRoleexample2processCompleteda:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName:
        Fn::GetAtt:
          - TriggerSubscriptionFunctionexample2processCompleteda
          - Arn
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn:
        Fn::GetAtt:
          - EventListenerexample2processCompleteda
          - Arn
Outputs:
  ApiUrl:
    Description: URL
    Value:
      Fn::GetAtt:
        - GraphQlApi
        - GraphQLUrl
  AppsyncId:
    Description: AppsyncId
    Value:
      Ref: GraphQlApi
  ApiKey:
    Description: ApiKey
    Value:
      Fn::GetAtt:
        - GraphQlApiKeyDefault
        - ApiKey
`
