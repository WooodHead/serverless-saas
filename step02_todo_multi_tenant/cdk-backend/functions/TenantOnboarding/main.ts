import CreateTenant from './addTenant';
import GetTenants from './fetchTenants';
import DeleteTenant from './deleteTenant';


exports.handler = async (event: any) => {
    console.log(event);
    try{
        const method = event.httpMethod;
        const requestName = event.path.startsWith('/') ? event.path.substring(1) : event.path;
        const body = JSON.parse(event.body);
        console.log("Req", requestName);
        console.log("BODY", body)

        if(method === "POST" && requestName === "addTenant"){
            const data = await CreateTenant(body);
            return {
                statusCode: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: data
            };
        }

        
        if(method === "POST" && requestName === "fetchTenants"){
            const data = await GetTenants(body);

            console.log(data)
            return {
                statusCode: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(data)
            };
        }

        
        if(method === "POST" && requestName === "deleteTenant"){
            const data = await DeleteTenant(body);

            console.log(data)
            return {
                statusCode: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: data
            };
        }

        return {
            statusCode: 400,
            headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            body: 'Invalid Method or Request'
        };

    }
    catch(err){
        return {
            statusCode: 400,
            headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            body: JSON.stringify(err)
        };
    }
}