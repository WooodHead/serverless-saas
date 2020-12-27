import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cognito from "@aws-cdk/aws-cognito";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";

export class Step01TodoSingleTenantAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'chat-app-user-pool', {
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
      signInAliases: {
        email: true
      },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE
      },
      autoVerify: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      }
    });

    new cognito.CfnUserPoolGroup(this, "AdminsGroup", {
      groupName: 'admins',
      userPoolId: userPool.userPoolId,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool
    });

    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    const role = new iam.Role(this, "CognitoDefaultAuthenticatedRole", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
            "cognito-identity:*",
          ],
          resources: ["*"],
      })
  );
  
  //   ///Attach particular role to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(
        this,
        "IdentityPoolRoleAttachment",
        {
          identityPoolId: identityPool.ref,
          roles: { authenticated: role.roleArn },
        }
    );


    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
    });

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

    const todosLambda = new lambda.Function(this, "TodoApiHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "main.handler",
      code: lambda.Code.fromAsset("functions"),
      memorySize: 1024,
      environment: {
        TODOS_TABLE: todosTable.tableName
      }
    });

    todosTable.grantFullAccess(todosLambda);

    const api = new apigw.LambdaRestApi(this, "TodoApiEndpoint", {
      handler: todosLambda,
      proxy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS // this is also the default
      },
    });

    const authorizer = new apigw.CfnAuthorizer(this, 'cfnAuth', {
      restApiId: api.restApiId,
      name: 'TodoAPIAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    })

    const getTodos = api.root.addResource('getTodos');
    getTodos.addMethod('GET', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      } 
    })

    const addTodo = api.root.addResource('addTodo');
    addTodo.addMethod('POST', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      } 
    })

    const deleteTodo = api.root.addResource('deleteTodo');
    deleteTodo.addMethod('POST', new apigw.LambdaIntegration(todosLambda), {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      } 
    })

    role.addToPolicy(
      // IAM policy granting users permission to a specific folder in the S3 bucket
      new iam.PolicyStatement({
        actions: ["execute-api:Invoke"],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:execute-api:us-east-2:*:${api.restApiId}/*/*/*`
        ],
      })
    );

  }
}
