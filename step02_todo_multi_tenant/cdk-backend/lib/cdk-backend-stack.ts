import * as cdk from '@aws-cdk/core';
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cognito from "@aws-cdk/aws-cognito";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as iam from '@aws-cdk/aws-iam';


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

    // new cdk.CfnOutput(this, "IdentityPoolId", {
    //   value: identityPool.ref,
    // });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId
    });


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

    const lambdaLayerVerifyTenant= new lambda.LayerVersion(this, "lambdaLayerVerifyTenant", {
      code: lambda.Code.fromAsset('lambdaLayers/lambdaLayerVerifyTenant'),
    });

    const todosLambda = new lambda.Function(this, "TodoApiHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "main.handler",
      code: lambda.Code.fromAsset("functions/Todo"),
      memorySize: 1024,
      environment: {
        TODOS_TABLE: todosTable.tableName,
        USER_POOL_ID: userPool.userPoolId
      },
      layers : [lambdaLayerGenerateId,lambdaLayerVerifyTenant]
    });


    todosLambda.addToRolePolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: ["cognito-idp:AdminListGroupsForUser*","dynamodb:*"]}))


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
    

  }
}
