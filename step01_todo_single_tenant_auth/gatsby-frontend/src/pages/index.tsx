import React, { useState, useRef, useEffect } from "react"
import { API, Auth } from "aws-amplify"
import shortid from "shortid"
const styles = require("./index.module.css")
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange, CognitoUserInterface } from '@aws-amplify/ui-components';
import axios from 'axios';

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

export interface CognitoUser extends CognitoUserInterface {
  signInUserSession?: {
      accessToken?: {
          jwtToken?: string,
          payload?: {
              ["cognito:groups"]?: string[],
              username?: string,
          }
      },
      idToken?: object,
      refreshToken?: object,
  }
}


export default function Home() {
  const [loading, setLoading] = useState(true)
  const [todoData, setTodoData] = useState([])
  const todoTitleRef = useRef<any>("");
  const [authState, setAuthState] = useState<AuthState>();
  const [user, setUser] = useState<CognitoUser>();
  const userGroup = user?.signInUserSession?.accessToken?.payload?.['cognito:groups'];

  const URL = "https://example.execute-api.us-east-2.amazonaws.com/prod";

  const addTodo = async () => {
    try {
      const todo = {
        id: shortid.generate(),
        title: todoTitleRef.current.value,
        done: false,
      }

      const data = await axios.post(`${URL}/addTodo`, todo, {
        headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
      })

      todoTitleRef.current.value = ""
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

  const fetchTodos = async () => {
    setLoading(true)
    try {
      const data = await axios.get(`${URL}/getTodos`, {
        headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
      })
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
      const data = await axios.post(`${URL}/deleteTodo`, {id: id}, {
        headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
      })
      console.log(data);
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData as CognitoUser)
      fetchTodos()
    });
    // fetchTodos()
  }, [])

  return (
    authState === AuthState.SignedIn && user ? (
        <div className="App">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} >
                <button onClick={() => { Auth.signOut() }} >sign out</button>
            </div>
            {
                userGroup && userGroup.findIndex((arr) => arr === "admins") !== -1 ?
                <div>
                  <h3>Role: Admin</h3>
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
                :
                  <div>
                    <h3>Role: User</h3>
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
            }
        </div>
    ) : 
    (
      <AmplifyAuthenticator usernameAlias="email"/>
    )
  )
}
