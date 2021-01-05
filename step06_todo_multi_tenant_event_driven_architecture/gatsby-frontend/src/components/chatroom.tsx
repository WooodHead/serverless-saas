import React, { useState, useEffect } from 'react';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import axios from 'axios';
import { Auth } from "aws-amplify"
import TodoList from './todoList'
import UsersList from './UsersList'
import endpoints from '../config'


type tenant = {
    name: string,
    desc: string
}

type todo = {
    createdAt: string,
    done: boolean,
    id: string,
    tenantId: string,
    title: string,
    username: string
}

function Chatroom(props: any) {
    const [authState, setAuthState] = useState<AuthState>();
    const [user, setUser] = useState<any>();
    const [tenantInfo, setTenantInfo] = useState<tenant | null | undefined>(null)
    const [loadingTenantInfo, setLoadingTenantInfo] = useState(true)
    const [loadingSocket,setLoadingSocket] = useState(true)
    const [error, setError] = useState<string>()
    const [todos,setTodos] = useState<todo[]>()
    const [tenantUsers,setTenantUsers] = useState<string[]>()



    const URLTenantOnboarding = endpoints.URLTenantOnboarding

   


    const verifyAuth = (tenant: tenant) => {

        return tenant.name === props.id

    }


    const getTenants = async () => {
        try {

            const input = {
                username: user.username
            }

            const data = await axios.post(`${URLTenantOnboarding}/fetchTenants`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            const verified = data.data.data.find(verifyAuth)

            setTenantInfo(verified)
            setLoadingTenantInfo(false)

            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }


    useEffect(() => {
        if (authState === AuthState.SignedIn && user) {
            getTenants()
        }

    }, [user, authState])


    useEffect(() => {
        onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);


    useEffect(() => {
        if (!tenantInfo && !loadingTenantInfo) {
            setError("Either this workspace doesn't exist or you are not allowed to access it!")
            setLoadingSocket(false)
        }

    }, [loadingTenantInfo])



    // useEffect(() => {
    //     const notification = window.Notification;
    //     var permission = notification.permission;
    
    //     if (permission === "denied" || permission === "granted") {
    //       return;
    //     }
    
    //     Notification.requestPermission();
    //   },[]);
    
      useEffect(() => {
      
        if (tenantInfo){

      const socket = new WebSocket(
    endpoints.URLWebsocket
  )

        socket.onopen = (event) => {
            socket.send(tenantInfo.name)
          console.log("onopen", event);
          setLoadingSocket(false)
        };

        socket.onmessage = (event:any) => {
          console.log("onmessage", event);
          console.log(JSON.parse(event.data))

          const data = JSON.parse(event.data)
    
          if (!!data.addTodo){
                setTodos((todos)=>{return([...todos, data.addTodo.todoItem])})
          }

          if (!!data.deleteTodo){
              setTodos((todos)=>{return(todos.filter((todo)=> todo.id!== data.deleteTodo.id))})
          }

          if (!!data.AddUser){

            setTenantUsers((users)=>{


                if (users.includes(data.AddUser.username)){
                    alert("THIS USER IS ALREADY IN YOUR TENANT")
                    return users
                }
    
                else{

                    return [...users, data.AddUser.username]
                }
    
            

            })
           

        
        }


        if (!!data.removeUser){

            setTenantUsers((users)=> users.filter((user)=> user !== data.removeUser.username))
           

        
        }


        };
    
        socket.onclose = (event) => {
          console.log("onclose", event);
        };

    
        return () => {
        socket.close();
        };
    }
      },[tenantInfo]);



      console.log("TODO",todos)


    return authState === AuthState.SignedIn && user ? (
        <div className="App">

            {(loadingTenantInfo || loadingSocket) ? <div>Loading...</div> :

                !!error ? <div>{error}</div> :

                    <div>
                        <h2>Todo List - {tenantInfo.name.slice(tenantInfo.name.indexOf("_")).replace(/_/g, " ")}</h2>

                        <TodoList tenantInfo={tenantInfo} username={user.username} todos = {todos} setTodos = {setTodos} />

                        <h2>Users List</h2>

                        <UsersList tenantInfo={tenantInfo} username={user.username} tenantUsers = {tenantUsers} setTenantUsers = {setTenantUsers} />

                    </div>

            }
        </div>
    ) : (
            <AmplifyAuthenticator />
        );
}

export default Chatroom;