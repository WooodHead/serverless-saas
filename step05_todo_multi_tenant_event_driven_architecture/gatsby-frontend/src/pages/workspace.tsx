import * as React from "react"
import { render } from "react-dom"
import { Router, RouteComponentProps, Link } from "@reach/router"
import Chatroom from '../components/chatroom'


function Workspace () {

    let InvalidWorkspace = (props: RouteComponentProps) => <div>No page found!</div>


return(
<div>
  <Router>
<InvalidWorkspace path = "/workspace" />
<Chatroom path = "/workspace/:id"  />
    
  </Router>
  </div>
)
}

export default Workspace;