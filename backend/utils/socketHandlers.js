const { getColumnTitle } = require('../utils/helpers');

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('taskMoved', (data) => {
      try {
        console.log('Task moved via socket:', data);
        
        const { taskId, from, to, user, userId } = data;
        
        // Broadcast to all OTHER clients (not the sender)
        socket.broadcast.emit('taskMoved', {
          taskId,
          taskTitle: data.taskTitle,
          from,
          to,
          fromTitle: data.fromTitle,
          toTitle: data.toTitle,
          user,
          userId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Broadcasted taskMoved: ${data.taskTitle} from ${data.fromTitle} to ${data.toTitle} by ${user}`);
      } catch (error) {
        console.error('Task moved socket error:', error);
      }
    });

    socket.on('taskCreated', (data) => {
      try {
        console.log('Task created via socket:', data);
        
        const { task, user, userId } = data;
        
        // Broadcast to all OTHER clients (not the sender)
        socket.broadcast.emit('taskCreated', {
          task,
          user,
          userId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Broadcasted taskCreated: ${task.title} by ${user}`);
      } catch (error) {
        console.error('Task created socket error:', error);
      }
    });

    socket.on('taskUpdated', (data) => {
      try {
        console.log('Task updated via socket:', data);
        
        const { task, user, userId } = data;
        
        // Broadcast to all OTHER clients (not the sender)
        socket.broadcast.emit('taskUpdated', {
          task,
          user,
          userId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Broadcasted taskUpdated: ${task.title} by ${user}`);
      } catch (error) {
        console.error('Task updated socket error:', error);
      }
    });

    socket.on('taskDeleted', (data) => {
      try {
        console.log('Task deleted via socket:', data);
        
        const { taskId, user, userId } = data;
        
        // Broadcast to all OTHER clients (not the sender)
        socket.broadcast.emit('taskDeleted', {
          taskId,
          user,
          userId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`Broadcasted taskDeleted: ${taskId} by ${user}`);
      } catch (error) {
        console.error('Task deleted socket error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandlers;
