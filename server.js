'use strict';

var express = require('express');
const exp = express();
const app = require('https').createServer(exp);
const io = require("socket.io")(app);
const server = io.listen(8000);

io.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept");
    next();
});

// event fired every time a new client connects:

server.on("connection", (socket) => {
    console.info(`Client connected [id=${socket.id}]`);
    
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }


    // when sockets disconnects, remove it from the list:
    socket.on("disconnect", () => {
        console.info(`Client gone [id=${socket.id}]`);
    });

    socket.on('message', function(message) {
        console.info("Message aufruf");
        log('Client said: ', message);
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);
    
        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');
    
        if (numClients === 0) {
          socket.join(room);
          log('Client ID ' + socket.id + ' created room ' + room);
          socket.emit('created', room, socket.id);
        } else if (numClients === 1) {
          log('Client ID ' + socket.id + ' joined room ' + room);
          // io.sockets.in(room).emit('join', room);
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready', room);
          socket.broadcast.emit('ready', room);
        } else { // max two clients
          socket.emit('full', room);
        }
      });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for( var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if(details.family === 'IPv4' && details.address !== '91.205.174.111') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function(room) {
        console.log(`Peer said bye on room ${room}.`);
      });

});

