const AWS = require('aws-sdk');
const VerifyTenantAdmin = require('/opt/verifyTenantAdmin');
const webSocketPublisher = require('/opt/webSocketPublisher');
import { addUserInput } from './types';

async function addUser(addUserInput: addUserInput) {

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

    const verified = await VerifyTenantAdmin.verifyAdmin(process.env.USER_POOL_ID, addUserInput.tenantId, addUserInput.tenantAdmin)

    if (verified) {

        var paramsAddUser = {
            GroupName: addUserInput.tenantId,
            UserPoolId: process.env.USER_POOL_ID,
            Username: addUserInput.username
        };

        try {
            const data = await cognitoidentityserviceprovider.adminAddUserToGroup(paramsAddUser).promise()
            console.log(data)
            await webSocketPublisher.publish(JSON.stringify({AddUser:{tenantId: addUserInput.tenantId, username: addUserInput.username }}),addUserInput.tenantId)
            return { AddUser: {tenantId: addUserInput.tenantId, username: addUserInput.username }};

        } catch (err) {
            console.log('DynamoDB error: ', err);
            throw err
        }

    }

    else {
        throw 'NOT AUTHORIZED';
    }
}

export default addUser;