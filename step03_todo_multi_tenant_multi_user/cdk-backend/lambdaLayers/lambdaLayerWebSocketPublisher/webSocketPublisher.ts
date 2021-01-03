var AWS = require('aws-sdk');

exports.publish = async (input: string) => {

  const endpoint = process.env.WEBSOCKET_ENDPOINT
  const apiGateway = new AWS.ApiGatewayManagementApi({ endpoint });
  const client = new AWS.DynamoDB.DocumentClient();

  const result = await client
    .scan({ TableName: process.env.WEBSOCKET_TABLE || "" })
    .promise();

  for (const data of result.Items ?? []) {
    const params = {
      Data: input,
      ConnectionId: data.connectionId,
    };

    try {
      await apiGateway.postToConnection(params).promise();
    } catch (err) {
      if (err.statusCode === 410) {
        console.log("Found stale connection, deleting " + data.connectionId);
        await client
          .delete({
            TableName: process.env.WEBSOCKET_TABLE || "",
            Key: { [process.env.WEBSOCKET_TABLE_KEY || ""]: data.connectionId },
          })
          .promise();
      } else {
        console.log("Failed to post. Error: " + JSON.stringify(err));
      }
    }
  }

}

