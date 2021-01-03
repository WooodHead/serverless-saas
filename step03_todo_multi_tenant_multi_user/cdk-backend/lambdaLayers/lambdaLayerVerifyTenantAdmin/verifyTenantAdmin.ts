
var AWS = require('aws-sdk');

exports.verifyAdmin = async (userPoolId: string, tenantId: string, tenantAdmin: string) => {

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });



    var params = {
        GroupName: tenantId,
        UserPoolId: userPoolId
    };


    try {
        const result = await cognitoidentityserviceprovider.getGroup(params).promise()

        const fetchGroupAdmin = result.Group.Description;


        if (fetchGroupAdmin === tenantAdmin) {

            return true
        }

        else {

            return false

        }

    }
    catch (error) {
        console.log(error)
        throw error
    }


};



