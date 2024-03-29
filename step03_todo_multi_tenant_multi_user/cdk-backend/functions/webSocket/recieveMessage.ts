const AWS = require('aws-sdk');

export async function handler(event: any): Promise<any> {
  console.log(`recieveMessage ${JSON.stringify(event)}`);

  const client = new AWS.DynamoDB.DocumentClient();

  // Save to DynamoDB table
  const result = await client
    .put({
      TableName: process.env.TABLE_NAME || "",
      Item: {
        connectionId: event.requestContext.connectionId,
        tenantId: event.body,
        date: new Date().toISOString()
      },
    })
    .promise();

  console.log(`put result ${JSON.stringify(result)}`);

  return {
    statusCode: 200,
    body: "onConnect.",
  };

}