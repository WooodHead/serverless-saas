import React, { useRef, useState, useEffect } from 'react';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import axios from 'axios';
import { Auth } from "aws-amplify"
import endpoints from '../config'


type tenantList = {
  name: string,
  desc: string
}


const AuthStateApp: React.FunctionComponent = () => {
  const [authState, setAuthState] = useState<AuthState>();
  const [user, setUser] = useState<any>();
  const [tenantList, setTenantList] = useState<tenantList[]>();

  const tenantTitleRef = useRef<any>("")

  const URLTenantOnboarding = endpoints.URLTenantOnboarding

  const addTenant = async () => {
    try {

      const tenantName = tenantTitleRef.current.value.replace(/ /g, "_");

      const input = {
        tenantName: tenantName,
        tenantAdmin: user.username
      }

      const data = await axios.post(`${URLTenantOnboarding}/addTenant`, input, {
        headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
      })

      console.log(data)
      tenantTitleRef.current.value = ""
      getTenants()
    } catch (e) {
      console.log(e)
      tenantTitleRef.current.value = ""
    }
  }

  const getTenants = async () => {
    try {

      const input = {
        username: user.username
      }

      const data = await axios.post(`${URLTenantOnboarding}/fetchTenants`, input, {
        headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
      })

      setTenantList(data.data.data)
      console.log(data)
    } catch (e) {
      console.log(e)
    }
  }

  const deleteTenant = async (tenantId) => {
    try {

      const input = {
        tenantId: tenantId
      }

      const data = await axios.post(`${URLTenantOnboarding}/deleteTenant`, input, {
        headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
      })

      console.log(data)
      getTenants()

    } catch (e) {
      console.log(e)
    }
  }



  useEffect(() => {
    onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData)
    });
  }, []);



  useEffect(() => {

    if (authState === AuthState.SignedIn && user) {
      getTenants()
    }
    else {
      setTenantList(undefined)
    }
  }, [user]);



  return authState === AuthState.SignedIn && user ? (
    <div className="App">

      <h1>Hello, {user.username}. Welcome to the Todo Application  </h1>


      <label>
        Add a Todo List
        <input size={100} ref={tenantTitleRef} type="text" placeholder="enter the title of your todo list"></input>
      </label>
      <button onClick={() => addTenant()}>Create</button>

      <h3>My Todo Lists</h3>

      {tenantList &&
        <div>
          <ul>
            {tenantList.map((tenant, ind) => {

              const tenantFiltered = tenant.name.slice(tenant.name.indexOf("_")).replace(/_/g, " ");

              return (<li key={ind}>
                <a href={`${location.href}workspace/${tenant.name}`} target="_blank" >
                  {tenantFiltered}
                </a>, admin: {tenant.desc} <button onClick={() => deleteTenant(tenant.name)}>Delete</button></li>)
            })}
          </ul>
        </div>
      }

      <div style={{ width: 200 }}>
        <AmplifySignOut />
      </div>

    </div>
  ) : (
      <AmplifyAuthenticator />
    );
}

export default AuthStateApp;

