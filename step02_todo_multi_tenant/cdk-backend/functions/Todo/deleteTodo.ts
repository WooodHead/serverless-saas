const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import {deleteTodoInput} from './types';
const verifyTenant = require('/opt/verifyTenant');


async function deleteTodo(deleteTodoInput: deleteTodoInput) {

    const verified = await verifyTenant.verifyUserTenant(deleteTodoInput.username, process.env.USER_POOL_ID, deleteTodoInput.tenantId)


    if (verified){
    const params = {
        TableName: process.env.TODOS_TABLE,
        Key: {
            id: deleteTodoInput.todoId
        }
    }
    try {
        await docClient.delete(params).promise()
        return deleteTodoInput.todoId
    } catch (err) {
        console.log('DynamoDB error: ', err)
        throw err
    }
}
else{
    throw 'NOT AUTHORIZED';
}
}

export default deleteTodo;