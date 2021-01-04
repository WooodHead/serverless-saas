import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Auth } from "aws-amplify"
import endpoints from '../config'

type todo = {
    createdAt: string,
    done: boolean,
    id: string,
    tenantId: string,
    title: string,
    username: string
}

interface props {
    tenantInfo: {
        name: string
        desc: string
    }
    username: string
}

function TodoList(props: props) {
    const [todos, setTodos] = useState<todo[]>()
    const todoTitleRef = useRef<any>("")

    const URLTodos = endpoints.URLTodos;


    const addTodo = async () => {
        try {
            const input = {
                title: todoTitleRef.current.value,
                done: false,
                tenantId: props.tenantInfo.name,
                username: props.username,
            }

            const data = await axios.post(`${URLTodos}/addTodo`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            getTodos()
            console.log(data)
            todoTitleRef.current.value = "";
        } catch (e) {
            console.log(e)
            console.log(e.response)
            console.log(e.request)

        }
    }

    const getTodos = async () => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: props.username
            }

            const data = await axios.post(`${URLTodos}/getTodos`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            setTodos(data.data)
            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }

    const deleteTodo = async (todoId: string) => {
        try {
            const input = {
                todoId: todoId,
                tenantId: props.tenantInfo.name,
                username: props.username
            }

            const data = await axios.post(`${URLTodos}/deleteTodo`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            console.log(data)
            getTodos()
        } catch (e) {
            console.log(e)
        }
    }


    useEffect(() => {

        getTodos()
    }, [])

    return todos ?
        <div>

            <label>
                Add a Todo
        <input size={100} ref={todoTitleRef} type="text" placeholder="enter the title of your todo"></input>
            </label>

            <button onClick={() => addTodo()}>Create</button>

            <ul>
                {todos.map((todo, ind) =>
                    <li key={ind}>{todo.title} <button onClick={() => deleteTodo(todo.id)}>Delete</button></li>

                )}
            </ul>

        </div> : <p>loading todos..</p>


}

export default TodoList;