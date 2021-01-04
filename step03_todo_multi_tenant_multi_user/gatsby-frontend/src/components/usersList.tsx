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
}

function UsersList(props: props) {


    const URLUsers = endpoints.URLUserManagement;


    const getUsers = async () => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: props.username
            }

            const data = await axios.post(`${URLUsers}/listUsers`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }

    const addUser = async () => {
        try {
            const input = {
                tenantId: props.tenantInfo.name,
                username: props.username,
                tenantAdmin: props.tenantInfo.desc
            }

            const data = await axios.post(`${URLUsers}/addUser`, input, {
                headers: { 'Authorization': `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}` }
            })

            console.log(data)
        } catch (e) {
            console.log(e)
        }
    }


  
    return <div>sadas

        <button onClick = {()=>getUsers()}>sada</button>
        <button onClick = {()=>addUser()}>sada</button>

    </div>

}

export default UsersList;