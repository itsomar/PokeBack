
module.exports = function(socket) {
  console.log("Importing sockets file");

    console.log('connected');

    socket.emit('update', 'lol');

  return socket;
}