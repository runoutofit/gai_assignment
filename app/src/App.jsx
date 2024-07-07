import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';
import faq from './faq.json';

const context_message = 'do not give out information not related to the FAQ in the system message, and do not share excessive information. for example, if the user did not ask for features, do not share the features. If the user asks something unrelated to the FAQ, reply with a message that says "I am sorry, I am a bot and can only answer questions related to the FAQ. Please ask me a question related to the product."';
const API_KEY = "sk-proj-wiJLF52eOA21A6PvCEbNT3BlbkFJHtkhywBJTR2rRIWAPOcy";
const systemMessage = {
  "role": "system", "content": faq.faq.map(faq => `${faq.question}: ${faq.answer}`).join("\n")
}

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm your personal chatbot, ask me anything related to our product!",
      sentTime: "just now",
      sender: "system"
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);

  // This function is called when the user sends a message. It adds the message to the chat and then calls the processMessageToChatGPT function.
  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);

    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  // This function sends the chat messages to the OpenAI API and processes the response. It then adds the response to the chat.
  async function processMessageToChatGPT(chatMessages) { 
    let apiMessages = chatMessages.map((messageObject) => {
      const role = messageObject.sender === "user" ? "user" : "assistant";
	  const contentWithContext = messageObject.sender === "user" ? messageObject.message + "\n" + context_message : messageObject.message;
      return { role: role, content: contentWithContext}
    });

    const apiRequestBody = {
      "model": "gpt-4",
      "messages": [
        systemMessage,
        ...apiMessages
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "system"
      }]);
      setIsTyping(false);
    });
  }

  return (
    <div className="App">
      <div style={{ position:"relative", height: "50vh", width: "30vw"  }}>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="chatbot is typing..." /> : null}
            >
              {messages.map((message, i) => {
                console.log(message)
                return <Message key={i} model={message} className={message.sender === "user" ? "user" : "system"}/>
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={(message) => handleSend(message)} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App