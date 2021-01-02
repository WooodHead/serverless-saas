import * as cdk from '@aws-cdk/core';
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cognito from "@aws-cdk/aws-cognito";
import * as apigw from "@aws-cdk/aws-apigateway";
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from "@aws-cdk/aws-s3"
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2"


export class CdkBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    
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



    // API Gateway for Web Sockets
    const api = new apigatewayv2.CfnApi(this, "web-socket-api", {
      name: "WebSocketApi",
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.action",
    });

    
    const region = "us-east-1";
    const stageName = "dev";
    const resouce = `arn:aws:execute-api:${region}:${this.account}:${api.ref}/${stageName}/POST/@connections/*`;
    const endpoint = `https://${api.ref}.execute-api.${region}.amazonaws.com/${stageName}`;

    

    const connectLambda = new lambda.Function(this, "web-socket-connect", {
      code: new lambda.AssetCode("lambda"),
      handler: "connect.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: webSocketConnectionStorage.tableName,
        TABLE_KEY: "connectionId",
      },
    });
  
    // Write permission to Dynamo
    webSocketConnectionStorage . grantWriteData ( connectLambda ) ;


    const disconnectLambda = new lambda.Function(
      this,
      "web-socket-ondisconnect",
      {
        code: new lambda.AssetCode("lambda"),
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


  
    const sendMessageLambda = new lambda.Function(this, "sendMessageLambda", {
      code: new lambda.AssetCode("lambda"),
      handler: "sendMessage.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        ENDPOINT: endpoint,
        TABLE_NAME: webSocketConnectionStorage.tableName,
        TABLE_KEY: "connectionId",
      },
    });

    sendMessageLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: ["execute-api:ManageConnections"]}))
  
    // Triggered by Put to s3
   // sendMessageLambda.addEventSource();
  
    // Grant for dynamoDB.table
    webSocketConnectionStorage.grantReadWriteData(sendMessageLambda);



    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [connectLambda.functionArn, disconnectLambda.functionArn],
      actions: ["lambda:InvokeFunction"],
    });

    const role = new iam.Role(this, `${api.name}-iam-role`, {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    role.addToPolicy(policy);


    const  integrationConnect  =  new  apigatewayv2.CfnIntegration (
      this,
      `Connect-lambda-integration`,
      {
        apiId : api.ref ,
        integrationType: "AWS_PROXY",
        integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${connectLambda.functionArn}/invocations`,
        credentialsArn: role.roleArn,
      }
    );
  
    const routeConnect = new apigatewayv2.CfnRoute(this, `Connect-route`, {
      apiId : api.ref ,
      routeKey: "$connect" ,
      authorizationType: "NONE",
      target: "integrations/" + integrationConnect.ref,
    });
  

    const  integrationDisconnect  =  new  apigatewayv2.CfnIntegration (
      this,
      `Disconnect-lambda-integration`,
      {
        apiId : api.ref ,
        integrationType: "AWS_PROXY",
        integrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${disconnectLambda.functionArn}/invocations`,
        credentialsArn: role.roleArn,
      }
    );
  
    const routeDisconnect = new apigatewayv2.CfnRoute(this, `Disconnect-route`, {
      apiId : api.ref ,
      routeKey: "$disconnect" ,
      authorizationType: "NONE",
      target: "integrations/" + integrationDisconnect.ref,
    });
   


    const deployment = new apigatewayv2.CfnDeployment(
      this,
      `${api.name}-deployment`,
      {
        apiId : api.ref ,
      }
    );
    deployment.addDependsOn(api);
    deployment.addDependsOn(routeConnect);
    deployment.addDependsOn(routeDisconnect);

    const stage = new apigatewayv2.CfnStage(this, `${api.name}-stage`, {
      apiId : api.ref ,
      autoDeploy: true,
      deploymentId: deployment.ref,
      stageName ,
    });
    stage.addDependsOn(deployment);




  }
}
