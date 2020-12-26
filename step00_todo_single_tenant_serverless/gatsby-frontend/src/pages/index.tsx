import React, { useState, useRef, useEffect } from "react"
import { API } from "aws-amplify"
import shortid from "shortid"
const styles = require("./index.module.css")
import axios from 'axios';

interface todo {
  title: string
  id: string
  done: boolean
}



export default function Home() {
  const [loading, setLoading] = useState(false)
  const [todoData, setTodoData] = useState([])
  const todoTitleRef = useRef<any>("")

  // const getTodos = /* GraphQL */ `
  //   query GetTodos {
  //     getTodos {
  //       id
  //       title
  //       done
  //     }
  //   }
  // `

  // const addTodo = /* GraphQL */ `
  //   mutation AddTodo($todo: TodoInput!) {
  //     addTodo(todo: $todo) {
  //       id
  //       title
  //       done
  //     }
  //   }
  // `

  // const deleteTodo = /* GraphQL */ `
  //   mutation DeleteTodo($todoId: String!) {
  //     deleteTodo(todoId: $todoId)
  //   }
  // `

  const URL = "https://example.execute-api.us-east-2.amazonaws.com/prod";

  const addTodo = async () => {
    try {
      const todo = {
        id: shortid.generate(),
        title: todoTitleRef.current.value,
        done: false,
      }

      const data = await axios.post(`${URL}/addTodo`, todo)

      todoTitleRef.current.value = ""
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

  const fetchTodos = async () => {
    setLoading(true)
    try {
      const data = await axios.get(`${URL}/getTodos`)
      console.log(data);
      setTodoData(data.data)
      setLoading(false)
    } catch (e) {
      console.log(e)
      setLoading(false)
    }
  }

  const deleteTodoMutation = async (id: string) => {
    try {
      const data = await axios.post(`${URL}/deleteTodo`, {
        id: id
      })
      console.log(data);
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  return (
    <div>
      {loading ? (
        <h1>Loading ...</h1>
      ) : (
        <div>
          <label>
            Todo:
            <input ref={todoTitleRef} />
          </label>
          <button onClick={addTodo}>Create Todo</button>
          {todoData &&
            todoData.map((item, ind) => (
              <div style={{ marginLeft: "1rem", marginTop: "2rem" }} key={ind}>
                <span className={styles.todoInput}> {item.title} </span>
                <button onClick={() => deleteTodoMutation(item.id)}>
                  Delete
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
