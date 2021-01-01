
var AWS = require('aws-sdk');

exports.verifyUserTenant = async (username:string, userPoolId:string, tenantId :string ) => {

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

    var params = {
        UserPoolId: userPoolId, /* required */
        Username: username, /* required */
        Limit: '25'
    };


    try {
        const result =  await cognitoidentityserviceprovider.adminListGroupsForUser(params).promise()
         console.log(result);
     
       const groupNames = result.Groups.map((group:any)=>{
             return group.GroupName
             })

        const verified = groupNames.indexOf(tenantId)

        if (verified !== -1){

            return true
        }

        else{

            return false
        }


           
     }
     catch(error){
         console.log(error)
         throw error
       }
    
    
};



