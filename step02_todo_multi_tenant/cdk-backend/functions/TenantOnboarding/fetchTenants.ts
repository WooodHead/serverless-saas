const AWS = require('aws-sdk');
import {inputFetchTenants} from './types'

async function GetTenants(input : inputFetchTenants) {

var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

var params = {
    UserPoolId: process.env.USER_POOL_ID, /* required */
    Username: input.username, /* required */
    Limit: '25'
};

try {
const result =  await cognitoidentityserviceprovider.adminListGroupsForUser(params).promise()
console.log(result);

const data =  result.Groups.map((group:any)=>{
    return {name : group.GroupName, desc: group.Description }
    })

return {data : data}
  
}
catch(error){
console.log(error)
throw error

}




  }

  export default GetTenants;

