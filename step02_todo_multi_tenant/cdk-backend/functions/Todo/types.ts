export type addTodoInput = {
    title: string;
    done: boolean;
    tenantId: string;
    username: string;
}

export type getTodosInput = {
    tenantId: string;
    username: string;
}

export type deleteTodoInput = {
    todoId: string;
    username: string,
    tenantId: string;
}
