import React from 'react';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import Amplify from "aws-amplify"
import awsmobile from "../aws-exports"
import axios from 'axios';
import { API, Auth } from "aws-amplify"



const AuthStateApp: React.FunctionComponent = () => {
    const [authState, setAuthState] = React.useState<AuthState>();
    const [user, setUser] = React.useState<any>();

    Amplify.configure(awsmobile)


    const URLTenantOnboarding = "https://tfrda585xg.execute-api.us-east-1.amazonaws.com/prod";
    const URLTodos = "https://ignujkedfl.execute-api.us-east-1.amazonaws.com/prod";

    const addTenant = async () => {
      try {
        const input = {
            tenantName: "test",
            tenantAdmin: user.username
        }
  
        const data = await axios.post(`${URLTenantOnboarding}/addTenant`, input, {
          headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
        })
  
        console.log(data)
      } catch (e) {
        console.log(e)
      }
    }

    const getTenants = async () => {
        try {

            const input = {
                username: user.username
            }
    
          const data = await axios.post(`${URLTenantOnboarding}/fetchTenants`, input, {
            headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
          })
    
          console.log(data)
        } catch (e) {
          console.log(e)
        }
      }

      const deleteTenant = async () => {
        try {

            const input = {
                tenantId: "test"
            }
    
          const data = await axios.post(`${URLTenantOnboarding}/deleteTenant`, input, {
            headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
          })
    
          console.log(data)
        } catch (e) {
          console.log(e)
        }
      }



      const addTodo = async () => {
        try {
          const input = {
            title: "test",
            done: false,
            tenantId: "test_ID",
            username: "test_username",
          }
    
          const data = await axios.post(`${URLTodos}/addTodo`, input, {
            headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
          })
    
          console.log(data)
        } catch (e) {
          console.log(e)
          console.log(e.response)
          console.log(e.request)
          
        }
      }




      const getTodos = async () => {
        try {
          const input = {
            tenantId: "testTenant",
            username: "testUsername"
          }
    
          const data = await axios.post(`${URLTodos}/getTodos`, input, {
            headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
          })
    
          console.log(data)
        } catch (e) {
          console.log(e)
        }
      }


      
      const deleteTodo = async () => {
        try {
          const input = {
            todoId: "test_id",
            tenantId: "testTenant",
            username: "testUsername"
          }
    
          const data = await axios.post(`${URLTodos}/deleteTodo`, input, {
            headers: {'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`}
          })
    
          console.log(data)
        } catch (e) {
          console.log(e)
        }
      }



    React.useEffect(() => {
        onAuthUIStateChange((nextAuthState, authData) => {
            setAuthState(nextAuthState);
            setUser(authData)
        });
    }, []);

  return authState === AuthState.SignedIn && user ? (
      <div className="App">
          <div>Hello, {user.username}</div>
          
          <button onClick = {()=> addTenant()} >addTenant</button>
          <button onClick = {()=> getTenants()} >fetchTenant</button>
          <button onClick = {()=> deleteTenant()} >deleteTenant</button>

          <button onClick = {()=> addTodo()} >addTodo</button>
          <button onClick = {()=> getTodos()} >getTodo</button>
          <button onClick = {()=> deleteTodo()} >deleteTodo</button>

          

          <AmplifySignOut />
      </div>
  ) : (
      <AmplifyAuthenticator />
  );
}

export default AuthStateApp;