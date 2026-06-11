import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, Loader2 } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);      
  const [input, setInput] = useState('');         
  const [isLoading, setIsLoading] = useState(false);  
  const messagesEndRef = useRef(null);

  const BACKEND_URL = 'http://localhost:3000/api';

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carga de historial desde la BD ferret
  const cargarHistorial = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/historial`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error cargando el historial:', error);
    }
  };

  // Enviar mensajes al modelo , Streaming con SSE 
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const mensajeUsuarioTexto = input;
    setInput('');
    setIsLoading(true); 

    const nuevoMensajeUsuario = {
      rol: 'user',
      contenido: mensajeUsuarioTexto,
      fechaHora: new Date().toISOString()
    };
    setMessages(prev => [...prev, nuevoMensajeUsuario]);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: mensajeUsuarioTexto })
      });

      if (!response.ok) throw new Error('Error en la comunicación con el servidor');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let respuestaIAAcumulada = '';
      setMessages(prev => [...prev, { rol: 'assistant', contenido: '', fechaHora: new Date().toISOString() }]);

      // Procesar la llegada progresiva de texto 
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lineas = chunk.split('\n');

        for (const linea of lineas) {
          if (linea.startsWith('data: ')) {
            const jsonStr = linea.replace('data: ', '').trim();
            
            if (jsonStr === '[DONE]') {
              setIsLoading(false); 
              continue;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.token) {
                respuestaIAAcumulada += parsed.token;
                
                setMessages(prev => {
                  const actualizados = [...prev];
                  actualizados[actualizados.length - 1].contenido = respuestaIAAcumulada;
                  return actualizados;
                });
              }
            } catch (err) {
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en el streaming:', error);
      setIsLoading(false);
    }
  };

  // Vaciar conversación 
  const handleClearChat = async () => {
    if (window.confirm('¿Seguro que deseas iniciar una nueva conversación?')) {
      try {
        await fetch(`${BACKEND_URL}/historial`, { method: 'DELETE' });
        setMessages([]);
      } catch (error) {
        console.error('Error al limpiar el chat:', error);
      }
    }
  };

  return (
    <div className="chat-container">
      {/* Cabecera con el botón de borrar conversación */}
      <header className="chat-header">
        <h2>ChatBot Phi3</h2>
        <button onClick={handleClearChat} className="btn-clear" title="Nueva Conversación">
          <Trash2 size={18} />
          <span>Nueva Conversación</span>
        </button>
      </header>

      {/* Contenedor de mensajes*/}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Bot size={48} />
            <p>¡Historial vacío! Envía un mensaje para comenzar a chatear.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            //Diferenciar mensajes del usuario y de la IA 
            <div key={index} className={`message-row ${msg.rol}`}>
              <div className="avatar">
                {msg.rol === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="message-bubble">
                <p>{msg.contenido}</p>
                <span className="timestamp">
                  {new Date(msg.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        
        {/*Indicador de carga mientras responde*/}
        {isLoading && (
          <div className="loading-indicator">
            <Loader2 className="spinner" size={20} />
            <span>Phi-3 está escribiendo...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/*Formulario con campo de entrada y botón de envío  */}
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje aquí..."
          disabled={isLoading}
          required
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="btn-send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default App;