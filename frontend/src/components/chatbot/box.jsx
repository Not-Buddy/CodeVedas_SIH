import React, { useState, useEffect } from "react";
import "./bot.css";

const Bot = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask me about Ayurveda, traditional diseases, or ICD-11II codes." }
  ]);
  const [input, setInput] = useState("");

  // Show bot icon after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call Gemini API
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyDCwCy5YWgcRRXydFzAoOUqsXdy-0c7G3U",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: input }] }
            ]
          }),
        }
      );

      const data = await res.json();
      const botReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn’t find information on that.";

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error fetching response. Try again." },
      ]);
    }

    setInput("");
  };

  return (
    <>
      {visible && (
        <div className="bot-container">
          {/* Floating Icon */}
          {!open && (
            <div className="bot-icon" onClick={() => setOpen(true)}>
              {/* 👇 Replace with your custom icon */}
              <span role="img" aria-label="chat">💬</span>
            </div>
          )}

          {/* Chat Window */}
          {open && (
            <div className="bot-chat">
              <div className="bot-header">
                <span>Ayurveda Assistant</span>
                <button onClick={() => setOpen(false)}>✖</button>
              </div>

              <div className="bot-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`bot-msg ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="bot-input">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about symptoms, codes, diseases..."
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Bot;
