import { useState, useEffect } from "react"
import { Container, Row, Col, Form, FormControl, ListGroup } from "react-bootstrap"
import { io } from 'socket.io-client'
import { User, Message } from '../types'

// 1. Every time when the page refreshes, user has ro reconnect to the socket.io server
// 2. The server will emit an event called "welcome" containing a message with the id of the connection, IF only connection is correctly established
// 3. If we want to do something when the event happens we shall LISTEN to that event by using socket.on("welcome", () => {})
// 4. After the user connects, the user sends the username to the server with emitting an event called "setUsername". Payload contains the username
// 5. Server is listening for "setUsername" event.
// 5.1 When the server receives the "setUsername" event, it will send a "loggedIn" event to the user.
// 5.2 After sending the "loggedIn" event, server broadcasts to all other online users with another event, with the updated list of onlineUsers
// 6. The list of online users is updated only during "login", but what happens if a new user joins after the "login"? In this case we are not updating the list
// 7. When a new user joins server emits an event called "updateOnlineUsersList", this is supposed to update that list when a user joins or leaves
// 8. When the client wants to send a message, it needs to EMIT an event called "sendMessage", as payload it should contain: sender, text, date
// 9. Server is listening for "sendMessage" event, when it receives that it will broadcast that message to everybody but the sender by firing an event called "newMessage"
// 10. Anybody who is listening for a "newMessage" event will receive that message and can then display the content on the page


const socket = io("http://localhost:3001", { transports: ['websocket'] }) // if we don't pass this option, socket.io will try to use polling


const Home = () => {
  const [username, setUsername] = useState("") //will be fetched from db
  const [message, setMessage] = useState("") //will be fetched from db
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]) //will be fetched from db
  const [loggedIn, setLoggedIn] = useState(false)
  const [chatHistory, setChatHistory] = useState<Message[]>([]) //will be fetched from db

  const [userID, setUserID] = useState("") //will be fetched from db
  const [currentID, setCurrentID] = useState("") //will be fetched from db

  useEffect(() => {
    // this code will be executed only once
    // we want to set our event listeners only once
    // therefore this is the good place for them
    socket.on("welcome", welcomeMessage => {
      console.log(welcomeMessage)
      setCurrentID(welcomeMessage.message)

      socket.on("loggedIn", onlineUsersList => {
        console.log(onlineUsersList)
        setOnlineUsers(onlineUsersList)
        setLoggedIn(true)
        setUserID(onlineUsersList[onlineUsersList.length - 1].socketId)
      })



      socket.on("updateOnlineUsersList", updatedList => {
        setOnlineUsers(updatedList)
      })

      socket.on("newMessage", newMessage => {
        console.log(newMessage)
        // setChatHistory([...chatHistory, newMessage.message])
        // if we set the state just by passing a value, the new message will be appended to the INITIAL state of the component (empty chat history [])
        // since we don't want that, we should use the set state function by passing a callback function instead
        // this is going to give us the possibility to access to the CURRENT state of the component (chat history filled with some messages)
        setChatHistory((chatHistory) => [...chatHistory, newMessage.message])

      })
    })
  }, [])

  console.log("User ID is:", currentID)
  console.log(chatHistory)
  const submitUsername = () => {
    // here we will be emitting the "setUsername" event (server is already listening for that)
    socket.emit("setUsername", { username })
  }

  const sendMessage = () => {
    const newMessage = {
      sender: username,
      text: message,
      createdAt: new Date().toLocaleString("en-gb"),
      socketID: userID,
    }
    socket.emit("sendMessage", { message: newMessage })
    setChatHistory([...chatHistory, newMessage])
  }

  return (
    <Container fluid>
      <Row style={{ height: "95vh" }} className="my-3">
        <Col md={9} className="d-flex flex-column justify-content-between">
          {/* LEFT COLUMN */}
          {/* TOP AREA: USERNAME INPUT FIELD */}
          {/* {!loggedIn && ( */}
          <Form
            onSubmit={e => {
              e.preventDefault()
              submitUsername()
            }}
          >
            <FormControl
              placeholder="Set your username here"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loggedIn}
            />
          </Form>
          {/* )} */}
          {/* MIDDLE AREA: CHAT HISTORY */}
          <ListGroup className="d-flex">
            {chatHistory.map((message, index) => ((message.socketID === currentID ? (
              <ListGroup.Item className="mb-2 sender-row" id="chat-user" key={index}>
                <Row className="pl-2" >
                  <Col className="d-flex justify-content-end">
                    {message.text}
                  </Col>
                </Row>
                <Row >
                  <Col className="d-flex justify-content-end">
                    {message.createdAt}
                  </Col>
                </Row>
              </ListGroup.Item>
            ) : (<ListGroup.Item className="mb-2 receiver-row" id="chat" key={index}>
              <Row className="pl-2">
                <strong>{message.sender}</strong>
              </Row>
              <Row>
                <Col className="pl-2">
                  {message.text}
                </Col>
              </Row>
              <Row>
                <Col className="d-flex justify-content-end">
                  {message.createdAt}
                </Col>
              </Row>


            </ListGroup.Item>))

            ))}
          </ListGroup>
          {/* BOTTOM AREA: NEW MESSAGE */}
          <Form
            onSubmit={e => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <FormControl
              placeholder="Write your message here"
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={!loggedIn}
            />
          </Form>
        </Col>
        <Col md={3}>
          {/* ONLINE USERS SECTION */}
          <div className="mb-3">Connected users:</div>
          {onlineUsers.length === 0 && (
            <ListGroup.Item>Log in to check who's online!</ListGroup.Item>
          )}
          <ListGroup>
            {onlineUsers.map(user => (<ListGroup.Item key={user.socketId}>{user.username}</ListGroup.Item>))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  )
}

export default Home
