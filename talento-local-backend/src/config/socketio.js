// src/config/socketio.js
const socketIO = require('socket.io');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });
    
    socket.on('send_message', (data) => {
      io.to(`conversation_${data.conversationId}`).emit('new_message', data);
    });
    
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
  
  return io;
}

module.exports = { initializeSocket };