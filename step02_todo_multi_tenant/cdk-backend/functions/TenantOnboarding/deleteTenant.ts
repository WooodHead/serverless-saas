const AWS = require('aws-sdk');
import {inputDeleteTenant} from './types'

async function DeleteTenant(input : inputDeleteTenant) {

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

var paramsListUsers = {
    GroupName: input.tenantId, /* required */
    UserPoolId:  process.env.USER_POOL_ID, /* required */
  };



try {
    const userData =  await cognitoidentityserviceprovider.listUsersInGroup(paramsListUsers).promise()

    const userNames = userData.Users.map((user:any)=> user.Username)
    console.log(userNames)


    for (let i=0; i<userNames.length; i++){

        
    var paramsRemoveUser = {
        GroupName: input.tenantId ,
        UserPoolId:  process.env.USER_POOL_ID,
        Username: userNames[i]
      };


       await cognitoidentityserviceprovider.adminRemoveUserFromGroup(paramsRemoveUser).promise()
 
    }


    var paramsDeleteGroup = {
        GroupName: input.tenantId ,
        UserPoolId:  process.env.USER_POOL_ID,
      };

     await cognitoidentityserviceprovider.deleteGroup(paramsDeleteGroup).promise()

    return "Group Deleted"


}
catch(error){
console.log(error)
throw error

}




  }

  export default DeleteTenant;

