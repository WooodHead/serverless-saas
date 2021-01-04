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


function Chatroom(props: any) {
    const [authState, setAuthState] = useState<AuthState>();
    const [user, setUser] = useState<any>();
    const [tenantInfo, setTenantInfo] = useState<tenant | null | undefined>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

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
            setLoading(false)

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
        if (!tenantInfo && !loading) {
            setError("Either this workspace doesn't exist or you are not allowed to access it!")

        }

    }, [loading])



    useEffect(() => {
        const notification = window.Notification;
        var permission = notification.permission;
    
        if (permission === "denied" || permission === "granted") {
          return;
        }
    
        Notification.requestPermission();
      },[]);
    
      useEffect(() => {
      
        if (tenantInfo){

        const socket = new WebSocket(
            "wss://75fkxx4wfk.execute-api.us-east-1.amazonaws.com/dev/"
          )

        socket.onopen = (event) => {
            socket.send(tenantInfo.name)
          console.log("onopen", event);
        };

        socket.onmessage = (event) => {
          console.log("onmessage", event);
          new Notification(event.data);
        };
    
        socket.onclose = (event) => {
          console.log("onclose", event);
        };

    
        return () => {
        socket.close();
        };
    }
      },[tenantInfo]);





    return authState === AuthState.SignedIn && user ? (
        <div className="App">

            {!!loading ? <div>Loading...</div> :

                !!error ? <div>{error}</div> :

                    <div>
                        <h2>Todo List - {tenantInfo.name.slice(tenantInfo.name.indexOf("_")).replace(/_/g, " ")}</h2>

                        <TodoList tenantInfo={tenantInfo} username={user.username} />

                        <h2>Users List</h2>

                        <UsersList tenantInfo={tenantInfo} username={user.username} />

                    </div>

            }
        </div>
    ) : (
            <AmplifyAuthenticator />
        );
}

export default Chatroom;