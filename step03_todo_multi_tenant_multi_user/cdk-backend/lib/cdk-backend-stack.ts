import * as cdk from '@aws-cdk/core';
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cognito from "@aws-cdk/aws-cognito";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as iam from '@aws-cdk/aws-iam';
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2"


export class CdkBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'UserPool',
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our awesome app!',
        emailBody: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
      },
      signInAliases: {
        username: true,
        email: true
      },
      standardAttributes: {
        fullname: {
          required: false,
          mutable: true,
        }
      }
    });


    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId
    });



    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId
    });








    // websocket


    const webSocketConnectionStorage = new ddb.Table(
      this,
      "webSocketConnectionStorage",
      {
        partitionKey: {
          name: "connectionId",
          type: ddb.AttributeType.STRING,
        },
        tableName: "webSocketConnectionStorage",
        billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      }
    );



    webSocketConnectionStorage.addGlobalSecondaryIndex({
      indexName: 'connections-by-tenant-id',
      partitionKey: {
        name: 'tenantId',
        type: ddb.AttributeType.STRING
      }
    })


    // API Gateway for Web Sockets
    const apiWebsocket = new apigatewayv2.CfnApi(this, "web-socket-api", {
      name: "WebSocketApi",
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.action",
    });


    const region = "us-east-1";
    const stageName = "dev";
    const resource = `arn:aws:execute-api:${region}:${this.account}:${apiWebsocket.ref}/${stageName}/POST/@connections/*`;
    const endpoint = `https://${apiWebsocket.ref}.execute-api.${region}.amazonaws.com/${stageName}`;




    // Write permission to Dynamo


    const disconnectLambda = new lambda.Function(
      this,
      "web-socket-ondisconnect",
      {
        code: new lambda.AssetCode("functions/webSocket"),
        handler: "disconnect.handler",
        runtime: lambda.Runtime.NODEJS_12_X,
        environment: {
          TABLE_NAME: webSocketConnectionStorage.tableName,
          TABLE_KEY: "connectionId",
        },
      }
    );

    // Write permission to Dynamo
    webSocketConnectionStorage.grantWriteData(disconnectLambda);







    const recieveMessageLambda = new lambda.Function(this, "web-socket-recieveMessageLambda", {
      code: new lambda.AssetCode("functions/webSocket"),
      handler: "recieveMessage.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: webSocketConnectionStorage.tableName,
        TABLE_KEY: "connectionId",
      },
    });

    // Write permission to Dynamo
    webSocketConnectionStorage.grantWriteData(recieveMessageLambda);














    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [ disconnectLambda.functionArn, recieveMessageLambda.functionArn],
      actions: ["lambda:InvokeFunction"],
    });

    const role = new iam.Role(this, `${apiWebsocket.name}-iam-role`, {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    role.addToPolicy(policy);







    const integrationRecieveMessage = new apigatewayv2.CfnIntegration(
      this,
      `RecieveMessage-lambda-integration`,
      {
        apiId: apiWebsocket.ref,
        integrationType: "AWS_PROXY",
        integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${recieveMessageLambda.functionArn}/invocations`,
        credentialsArn: role.roleArn,
      }
    );

    const routeRecieveMessage = new apigatewayv2.CfnRoute(this, `recieveMessage-route`, {
      apiId: apiWebsocket.ref,
      routeKey: "$default",
      authorizationType: "NONE",
      target: "integrations/" + integrationRecieveMessage.ref,
    });





    const integrationDisconnect = new apigatewayv2.CfnIntegration(
      this,
      `Disconnect-lambda-integration`,
      {
        apiId: apiWebsocket.ref,
        integrationType: "AWS_PROXY",
        integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${disconnectLambda.functionArn}/invocations`,
        credentialsArn: role.roleArn,
      }
    );

    const routeDisconnect = new apigatewayv2.CfnRoute(this, `Disconnect-route`, {
      apiId: apiWebsocket.ref,
      routeKey: "$disconnect",
      authorizationType: "NONE",
      target: "integrations/" + integrationDisconnect.ref,
    });



    const deployment = new apigatewayv2.CfnDeployment(
      this,
      `${apiWebsocket.name}-deployment`,
      {
        apiId: apiWebsocket.ref,
      }
    );
    deployment.addDependsOn(apiWebsocket);
    deployment.addDependsOn(routeDisconnect);
    deployment.addDependsOn(routeRecieveMessage);



    const stage = new apigatewayv2.CfnStage(this, `${apiWebsocket.name}-stage`, {
      apiId: apiWebsocket.ref,
      autoDeploy: true,
      deploymentId: deployment.ref,
      stageName,
    });
    stage.addDependsOn(deployment);






















    const todosTable = new ddb.Table(this, "CDKTodosTable", {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
    });



    todosTable.addGlobalSecondaryIndex({
      indexName: 'todos-by-tenant-id',
      partitionKey: {
        name: 'tenantId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: ddb.AttributeType.STRING
      }
    })

    const lambdaLayerGenerateId = new lambda.LayerVersion(this, "lambdaLayerGenerateId", {
      code: lambda.Code.fromAsset('lambdaLayers/lambdaLayerGenerateId'),
    });

    const lambdaLayerVerifyTenant = new lambda.LayerVersion(this, "lambdaLayerVerifyTenant", {
      code: lambda.Code.fromAsset('lambdaLayers/lambdaLayerVerifyTenant'),
    });

    const lambdaLayerVerifyTenantAdmin = new lambda.LayerVersion(this, "lambdaLayerVerifyTenantAdmin", {
      code: lambda.Code.fromAsset('lambdaLayers/lambdaLayerVerifyTenantAdmin'),
    });

    const lambdaLayerWebSocketPublisher = new lambda.LayerVersion(this, "lambdaLayerWebSocketPublisher", {
      code: lambda.Code.fromAsset('lambdaLayers/lambdaLayerWebSocketPublisher'),
    });

    const todosLambda = new lambda.Function(this, "TodoApiHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "main.handler",
      code: lambda.Code.fromAsset("functions/Todo"),
      memorySize: 1024,
      environment: {
        TODOS_TABLE: todosTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        WEBSOCKET_ENDPOINT: endpoint,
        WEBSOCKET_TABLE: webSocketConnectionStorage.tableName,
        WEBSOCKET_TABLE_KEY: "connectionId",
      },
      layers: [lambdaLayerGenerateId, lambdaLayerVerifyTenant, lambdaLayerWebSocketPublisher]
    });


    todosLambda.addToRolePolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: ["cognito-idp:AdminListGroupsForUser*", "dynamodb:*", "execute-api:ManageConnections"]
    }))


    const apiTodo = new apigw.LambdaRestApi(this, "TodoApiEndpoint", {
      handler: todosLambda,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS // this is also the default
      },
    });

    const authorizerTodo = new apigw.CfnAuthorizer(this, 'cfnAuthTodo', {
      restApiId: apiTodo.restApiId,
      name: 'TodoAPIAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    })

    const getTodos = apiTodo.root.addResource('getTodos');
    getTodos.addMethod('POST', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTodo.ref
      }
    })

    const addTodo = apiTodo.root.addResource('addTodo');
    addTodo.addMethod('POST', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTodo.ref
      }
    })

    const deleteTodo = apiTodo.root.addResource('deleteTodo');
    deleteTodo.addMethod('POST', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTodo.ref
      }
    })






    const tenantOnboardingLambda = new lambda.Function(this, "TenantOnboardingApiHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "main.handler",
      code: lambda.Code.fromAsset("functions/TenantOnboarding"),
      memorySize: 1024,
      environment: {
        USER_POOL_ID: userPool.userPoolId
      },
      layers: [lambdaLayerGenerateId]

    });

    tenantOnboardingLambda.addToRolePolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: ["cognito-idp:CreateGroup*", "cognito-idp:AdminAddUserToGroup*", "cognito-idp:AdminRemoveUserFromGroup*", "cognito-idp:AdminListGroupsForUser*", "cognito-idp:ListUsersInGroup*", "cognito-idp:DeleteGroup*"]
    }))

    const apiTenantOnboarding = new apigw.LambdaRestApi(this, "TenantOnboardingApiEndpoint", {
      handler: tenantOnboardingLambda,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS // this is also the default
      },

    });

    const authorizerTenantOnboarding = new apigw.CfnAuthorizer(this, 'cfnAuthTenantOnboarding', {
      restApiId: apiTenantOnboarding.restApiId,
      name: 'TenantOnboardingAPIAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    })


    const addTenant = apiTenantOnboarding.root.addResource('addTenant');
    addTenant.addMethod('POST', new apigw.LambdaIntegration(tenantOnboardingLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTenantOnboarding.ref
      }
    })

    const fetchTenants = apiTenantOnboarding.root.addResource('fetchTenants');
    fetchTenants.addMethod('POST', new apigw.LambdaIntegration(tenantOnboardingLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTenantOnboarding.ref
      }
    })

    const deleteTenant = apiTenantOnboarding.root.addResource('deleteTenant');
    deleteTenant.addMethod('POST', new apigw.LambdaIntegration(tenantOnboardingLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerTenantOnboarding.ref
      }
    })






    const usersManagementLambda = new lambda.Function(this, "usersManagementLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "main.handler",
      code: lambda.Code.fromAsset("functions/UsersManagement"),
      memorySize: 1024,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        WEBSOCKET_ENDPOINT: endpoint,
        WEBSOCKET_TABLE: webSocketConnectionStorage.tableName,
        WEBSOCKET_TABLE_KEY: "connectionId",

      },
      layers: [lambdaLayerVerifyTenantAdmin, lambdaLayerWebSocketPublisher, lambdaLayerVerifyTenant]

    });

    usersManagementLambda.addToRolePolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: ["cognito-idp:AdminAddUserToGroup*", "cognito-idp:AdminRemoveUserFromGroup*", "cognito-idp:GetGroup*", "dynamodb:*", "execute-api:ManageConnections", "cognito-idp:AdminListGroupsForUser*", "cognito-idp:ListUsersInGroup*"]
    }))

    const apiUsersManagement = new apigw.LambdaRestApi(this, "UsersManagementApiEndpoint", {
      handler: usersManagementLambda,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS // this is also the default
      },

    });

    const authorizerUsersManagement = new apigw.CfnAuthorizer(this, 'cfnAuthUsersManagement', {
      restApiId: apiUsersManagement.restApiId,
      name: 'UsersManagementAPIAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    })


    const addUser = apiUsersManagement.root.addResource('addUser');
    addUser.addMethod('POST', new apigw.LambdaIntegration(usersManagementLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerUsersManagement.ref
      }
    })

    const removeUser = apiUsersManagement.root.addResource('removeUser');
    removeUser.addMethod('POST', new apigw.LambdaIntegration(usersManagementLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerUsersManagement.ref
      }
    })


    const listUsers = apiUsersManagement.root.addResource('listUsers');
    listUsers.addMethod('POST', new apigw.LambdaIntegration(usersManagementLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizerUsersManagement.ref
      }
    })



















  }
}
