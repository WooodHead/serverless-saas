import addUser from './addUser';
import removeUser from './removeUser';

exports.handler = async (event: any) => {
    console.log(event);
    try {
        const method = event.httpMethod;
        const requestName = event.path.startsWith('/') ? event.path.substring(1) : event.path;
        const body = JSON.parse(event.body);


        if (method === "POST" && requestName === "addUser") {

            const user = await addUser(body);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(user)
            };
        }

        else if (method === "POST" && requestName === "removeUser") {

            const user = await removeUser(body);
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(user)
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
    catch (err) {

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