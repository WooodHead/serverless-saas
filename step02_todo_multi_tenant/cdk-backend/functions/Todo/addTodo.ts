const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const shortId = require('shortid');
const verifyTenant = require('/opt/verifyTenant');
import { addTodoInput } from './types';

async function addTodo(todoInput: addTodoInput) {

    const verified = await verifyTenant.verifyUserTenant(todoInput.username, process.env.USER_POOL_ID, todoInput.tenantId)

    if (verified) {

        const todoItem = { ...todoInput, id: shortId.generate(), createdAt: new Date().toISOString() };

        const params = {
            TableName: process.env.TODOS_TABLE,
            Item: todoItem
        }
        try {
            await docClient.put(params).promise();
            return todoItem;
            
        } catch (err) {
            console.log('DynamoDB error: ', err);
            throw err
        }

    }

    else {
        throw 'NOT AUTHORIZED';
    }
}

export default addTodo;