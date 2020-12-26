import addTodo from './addTodo';
import deleteTodo from './deleteTodo';
import getTodos from './getTodos';

exports.handler = async (event: any) => {
    // console.log(event);
    try{
        const method = event.httpMethod;
        const requestName = event.path.startsWith('/') ? event.path.substring(1) : event.path;
        const body = JSON.parse(event.body);
        console.log("Req", requestName);
        console.log("BODY", body)
        if(method === "GET" && requestName === "getTodos"){
            const todos = await getTodos();
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(todos)
            };
        }
        else if(method === "POST" && requestName === "addTodo"){
            const todo = await addTodo(body);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(todo)
            };
        }
        else if(method === "DELETE" && requestName === "deleteTodo"){
            await deleteTodo(body.id);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify('true')
            };
        }

        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: 'Invalid Method or Request'
        };

    }
    catch(err){
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(err)
        };
    }
}