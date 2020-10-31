// app.js
const express = require('express');  
const app = express();  
const server = require('http').createServer(app);  
const io = require('socket.io')(server);
const path = require('path')
const uuid = require('uuid').v4
app.use(express.static(path.join( __dirname , '../' , '/public')));  




io.on('connection', function(client) {
    console.log('Client connected...');
    client.on('call', function(data) {
        client.broadcast.emit('offer' , data)
    });

    client.on('answer' , data => {
        client.broadcast.emit('answer' , data)
    })
    client.on('new-ice-candidate' , data => {
        client.broadcast.emit('new-ice-candidate' , data)
    })
});


app.get('/', function(req, res,next) {  
    res.sendFile(path.resolve('./' , 'public' , 'index.html'));
});

server.listen(8081);