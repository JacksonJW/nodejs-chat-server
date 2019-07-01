const app = require("express")();
const http = require("http").Server(app);
const server = require("socket.io")(http);

const names = new Set();
const MAX_AMOUNT_OF_USERS = 2;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/chat.html");
});

server.on("connection", function(socket) {
  console.log("a user connected from address:", socket.remoteAddress);

  socket.on("chat message", function(msg) {
    if (msg === "/quit") {
      socket.emit("redirect window", "");
      //socket.disconnect();
    } else if (msg.startsWith("/yell ")) {
      server.emit(
        "chat message",
        socket.senderName +
          ": " +
          msg.substring(msg.indexOf(" ") + 1, msg.length).toUpperCase()
      );
    } else if (msg === "/count") {
      socket.emit(
        "chat message",
        `There are ${names.size} person(s) in the chat room.`
      );
    } else if (msg.startsWith("/changename ")) {
      let oldName = socket.senderName;
      let newName = msg.substring(msg.indexOf(" ") + 1, msg.length);
      names.delete(oldName);
      names.add(newName);
      socket.senderName = newName;
      server.emit(
        "chat message",
        `${oldName} has changed their name to ${newName}.`
      );
    } else if (msg === "/help") {
      socket.emit("help", "");
    } else {
      console.log(socket.senderName + ": " + msg);
      server.emit("chat message", socket.senderName + ": " + msg);
    }
  });

  socket.on("proposed name", function(proposedName) {
    // let proposedName = Window.prompt("Enter in a name:");
    if (
      !names.has(proposedName) &&
      proposedName != null &&
      proposedName != ""
    ) {
      names.add(proposedName);
      if (names.size - 1 === MAX_AMOUNT_OF_USERS) {
        socket.emit("server full");
        names.delete(proposedName);
        socket.disconnect(true);
      } else {
        let actualName = proposedName;
        socket.senderName = actualName;
        server.emit("acceptable name", `${actualName} has entered the room.`);
      }
    } else {
      socket.emit("denied name");
      //promptName();
    }
  });

  socket.on("disconnect", function() {
    server.emit("chat message", `user ${socket.senderName} has left the room.`);
    console.log("user disconnected");
    names.delete(socket.senderName);
  });
});

http.listen(58901, function() {
  console.log("listening on port 58901");
});
