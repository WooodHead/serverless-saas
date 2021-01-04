const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import { getTodosInput } from './types';
const verifyTenant = require('/opt/verifyTenant');


async function getTodos(getTodosInput: getTodosInput) {

    const verified = await verifyTenant.verifyUserTenant(getTodosInput.username, process.env.USER_POOL_ID, getTodosInput.tenantId)

    if (verified) {

        const params = {
            TableName: process.env.TODOS_TABLE,
            ExpressionAttributeValues: { ":tenantId": getTodosInput.tenantId },
            KeyConditionExpression: `tenantId = :tenantId`,
            IndexName: 'todos-by-tenant-id',
            // NextToken: !!event.arguments.nextToken?event.arguments.nextToken : null ,
            ScanIndexForward: true,
            Select: "ALL_ATTRIBUTES"
        }
        try {
            const data = await docClient.query(params).promise()
            return data.Items
        } catch (err) {
            console.log('DynamoDB error: ', err)
            throw err
        }
    }
    else {
        throw 'NOT AUTHORIZED';
    }
}

export default getTodos;

