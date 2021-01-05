import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Auth } from "aws-amplify"
import endpoints from '../config'



interface props {
    tenantInfo: {
        name: string
        desc: string
    }
    username: string
    tenantUsers: string[]
    setTenantUsers: React.Dispatch<React.SetStateAction<string[]>>
}

function UsersList(props: props) {


    const URLUsers = endpoints.URLUserManagement;
    const usernameRef = useRef<any>("")

    const getUsers = async () => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: props.username
            }

            const data = await axios.post(`${URLUsers}/listUsers`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            props.setTenantUsers(data.data.Users.map((user:any)=> user.Username))
            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }


    useEffect(()=>{
        getUsers()

    },[])



    


    const addUser = async () => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: usernameRef.current.value,
                tenantAdmin: props.tenantInfo.desc
            }

            const data = await axios.post(`${URLUsers}/addUser`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            usernameRef.current.value = ""

            console.log(data)
        } catch (e) {
            console.log(e)

            alert("THERE WAS AN ERROR ADDING THE USER. MOST PROBABLY THIS USER DOESN'T EXIST")
            usernameRef.current.value = ""
        }
    }


    const removeUser = async (user) => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: user,
                tenantAdmin: props.tenantInfo.desc
            }

            const data = await axios.post(`${URLUsers}/removeUser`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }

  
return props.tenantUsers ?
        <div>
            {props.username === props.tenantInfo.desc &&

                <div>
            <label>
                Add a User
        <input size={50} ref={usernameRef} type="text" placeholder="enter username"></input>
            </label>

            <button onClick={() => addUser()}>Add</button>

            </div>
}
            <p>ADMIN: {props.tenantInfo.desc}</p>

            <ul>
                {props.tenantUsers.map((user, ind) =>{
                    
                    if (user !== props.tenantInfo.desc){

                   return( <li key={ind}>{user} {props.username === props.tenantInfo.desc && <button onClick={() => removeUser(user)}>Delete</button>}</li>)
                }
                })
            }
            </ul>

        </div> : <p>loading users..</p>




}

export default UsersList;