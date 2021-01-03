const AWS = require('aws-sdk');
import {inputCreateTenant} from './types'
const shortId = require('shortid');

async function CreateTenant(input:inputCreateTenant) {

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});


const uniqueId = shortId.generate();

    var paramsCreateGroup = {
      GroupName: uniqueId + "_"+ input.tenantName, /* required */
      UserPoolId: process.env.USER_POOL_ID, // process.env.USER_POOL_ID, /* required */
      Description: input.tenantAdmin,
     // Precedence: 1,
     // RoleArn: ''
    };
      
    var paramsAddUser = {
      GroupName:  uniqueId + "_" + input.tenantName,
      UserPoolId: process.env.USER_POOL_ID,
      Username: input.tenantAdmin
    };
  

    try {
   await cognitoidentityserviceprovider.createGroup(paramsCreateGroup).promise()
   await cognitoidentityserviceprovider.adminAddUserToGroup(paramsAddUser).promise()
   return "Group Created"

    }
   catch(error){
     throw error
   }


  }

  export default CreateTenant;

