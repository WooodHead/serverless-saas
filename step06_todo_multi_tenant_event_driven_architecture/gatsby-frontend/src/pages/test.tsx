import React, { useRef, useState, useEffect } from 'react';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import axios from 'axios';
import { Auth } from "aws-amplify"


export default function Home() {


  const [authState, setAuthState] = useState<AuthState>();
  const [user, setUser] = useState<any>();
 
  const socket = new WebSocket(
    "test"
  );
  const URL = "test"
  const URL1 = "test"


  const addTodo = async () => {
    try {
        const input = {
            title: "test",
            done: false,
            tenantId: "test",
            username: "test",
        }

        const data = await axios.post(`${URL}/addTodo`, input, {
            headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
        })

        
        console.log(data)

    } catch (e) {
        console.log(e)
        console.log(e.response)
        console.log(e.request)

    }
}


const addUser = async () => {
  try {
      const input = {
          tenantId: "test",
          username: "test",
          tenantAdmin: "test",
      }

      const data = await axios.post(`${URL1}/addUser`, input, {
          headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
      })

      
      console.log(data)

  } catch (e) {
      console.log(e)
      console.log(e.response)
      console.log(e.request)

  }
}



const removeUser = async () => {
  try {
      const input = {
          tenantId: "test",
          username: "test",
          tenantAdmin: "test",
      }

      const data = await axios.post(`${URL1}/removeUser`, input, {
          headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
      })

      
      console.log(data)

  } catch (e) {
      console.log(e)
      console.log(e.response)
      console.log(e.request)

  }
}


  useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData)
    });
  }, []);

  React.useEffect(() => {
    const notification = window.Notification;
    var permission = notification.permission;

    if (permission === "denied" || permission === "granted") {
      return;
    }

    Notification.requestPermission();
  });

  React.useEffect(() => {
    socket.onopen = (event) => {
      console.log("onopen", event);
    };

    socket.onmessage = (event) => {
      console.log("onmessgae", event);
      new Notification(event.data);
    };

    socket.onclose = (event) => {
      console.log("onclose", event);
    };

    return () => {
      socket.close();
    };
  });


  return authState === AuthState.SignedIn && user ? (
    <div>
    <h1>{user.username}</h1>
    <button onClick = {()=>addTodo()} >addTodo</button>
    <button onClick = {()=>addUser()} >addUser</button>
    <button onClick = {()=>removeUser()} >removeUser</button>


        <AmplifySignOut />
        </div>
  ) : (
      <AmplifyAuthenticator />
    );
}
