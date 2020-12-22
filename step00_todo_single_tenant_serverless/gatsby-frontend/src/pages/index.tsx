import React, { useState, useRef, useEffect } from "react"
import { API } from "aws-amplify"
import shortid from "shortid"
const styles = require("./index.module.css")

interface todo {
  title: string
  id: string
  done: boolean
}

interface incomingData {
  data: {
    getTodos: todo[]
  }
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [todoData, setTodoData] = useState<incomingData | null>(null)
  const todoTitleRef = useRef<any>("")

  const getTodos = /* GraphQL */ `
    query GetTodos {
      getTodos {
        id
        title
        done
      }
    }
  `

  const addTodo = /* GraphQL */ `
    mutation AddTodo($todo: TodoInput!) {
      addTodo(todo: $todo) {
        id
        title
        done
      }
    }
  `

  const deleteTodo = /* GraphQL */ `
    mutation DeleteTodo($todoId: String!) {
      deleteTodo(todoId: $todoId)
    }
  `

  const addTodoMutation = async () => {
    try {
      const todo = {
        id: shortid.generate(),
        title: todoTitleRef.current.value,
        done: false,
      }
      const data = await API.graphql({
        query: addTodo,
        variables: {
          todo: todo,
        },
      })
      todoTitleRef.current.value = ""
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

  const fetchTodos = async () => {
    try {
      const data = await API.graphql({
        query: getTodos,
      })
      setTodoData(data as incomingData)
      setLoading(false)
    } catch (e) {
      console.log(e)
    }
  }

  const deleteTodoMutation = async (id: string) => {
    try {
      const data = await API.graphql({
        query: deleteTodo,
        variables: {
          todoId: id,
        },
      })

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
          <button onClick={() => addTodoMutation()}>Create Todo</button>
          {todoData.data &&
            todoData.data.getTodos.map((item, ind) => (
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
