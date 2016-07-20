
module.exports = function(io) {
  console.log("Importing sockets file");

  io.on('connection', function (socket) {
    console.log('connected');

    socket.emit('update', 'lol');

  });

  return io;
}