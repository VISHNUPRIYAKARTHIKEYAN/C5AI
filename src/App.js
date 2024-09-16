import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie'; // For handling cookies
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [history, setHistory] = useState([]);
  const [tableData, setTableData] = useState([]); // Store table data here
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Fetch chat history from cookies when the component mounts
    const storedHistory = Cookies.get('chat-history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }

    // Fetch all table data when the app loads
    fetchTableData();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchTableData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/data');
      setTableData(response.data);
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage = { role: 'user', content: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
      setIsTyping(true);

      try {
        const response = await axios.post('http://localhost:5000/api/query', { query: input });
        const botMessage = { role: 'bot', content: JSON.stringify(response.data.result, null, 2) };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'bot', content: 'Sorry, something went wrong!' },
        ]);
      }
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    // Save the current chat to history
    if (messages.length > 0) {
      const newHistory = [...history, messages];
      setHistory(newHistory);
      Cookies.set('chat-history', JSON.stringify(newHistory), { expires: 7 }); // Save to cookies
      setMessages([]);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <button className="toggle-btn" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
        <div className="header-title">C5i</div>
        <button className="new-chat-btn" onClick={startNewChat}>
          New Chat
        </button>
      </header>
      <div className="main-content">
        {showHistory && (
          <div className="chat-history">
            {history.map((chat, index) => (
              <div key={index} className="history-chat">
                <h3>Chat {index + 1}</h3>
                {chat.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={`chat-area ${showHistory ? 'expanded' : ''}`}>
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="message-content">Typing...</div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
            />
            <button type="submit">➤</button>
          </form>
        </div>
      </div>
      {/* Display the data from the tables */}
      <div className="table-data">
        {tableData.map((table, idx) => (
          <div key={idx} className="table-container">
            <h3>{table.table} Data</h3>
            <table>
              <thead>
                <tr>
                  {Object.keys(table.data[0] || {}).map((key, i) => (
                    <th key={i}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td key={j}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
