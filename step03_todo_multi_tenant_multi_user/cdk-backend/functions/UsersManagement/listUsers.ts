const AWS = require('aws-sdk');
const verifyTenant = require('/opt/verifyTenant');
import { listUsersInput } from './types';

async function ListUsers(listUsersInput: listUsersInput) {

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

    const verified = await verifyTenant.verifyUserTenant(listUsersInput.username, process.env.USER_POOL_ID, listUsersInput.tenantId)

    if (verified) {

        var params = {
            GroupName: listUsersInput.tenantId, /* required */
            UserPoolId:  process.env.USER_POOL_ID, /* required */
          };
      

        try {
            const data =  await cognitoidentityserviceprovider.listUsersInGroup(params).promise()
            console.log(data)
            return data;

        } catch (err) {
            console.log('DynamoDB error: ', err);
            throw err
        }

    }

    else {
        throw 'NOT AUTHORIZED';
    }
}

export default ListUsers;