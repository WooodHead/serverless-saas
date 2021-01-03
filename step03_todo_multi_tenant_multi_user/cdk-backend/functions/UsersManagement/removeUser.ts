const AWS = require('aws-sdk');
const VerifyTenantAdmin = require('/opt/verifyTenantAdmin');
const webSocketPublisher = require('/opt/webSocketPublisher');
import { removeUserInput } from './types';

async function addUser(removeUserInput: removeUserInput) {

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

    const verified = await VerifyTenantAdmin.verifyAdmin(process.env.USER_POOL_ID, removeUserInput.tenantId, removeUserInput.tenantAdmin)

    if (verified) {

        var paramsRemoveUser = {
            GroupName: removeUserInput.tenantId,
            UserPoolId: process.env.USER_POOL_ID,
            Username: removeUserInput.username
        };


        try {
            const data = await cognitoidentityserviceprovider.adminRemoveUserFromGroup(paramsRemoveUser).promise()
            console.log(data)
            await webSocketPublisher.publish(JSON.stringify({ operation: "REMOVE_USER", tenantId: removeUserInput.tenantId, username: removeUserInput.username }))
            return { operation: "REMOVE_USER", tenantId: removeUserInput.tenantId, username: removeUserInput.username };

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