const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  // app.use(express.static(path.join(__dirname1, "/frontend/build")));

  // app.get("*", (req, res) =>
  //   res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html")),
  // );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});

const Message = require("./models/messageModel");

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (data) => {
    // data: { room, user: senderName }
    if (typeof data === "string") {
      socket.in(data).emit("typing");
    } else {
      socket.in(data.room).emit("typing", data.user);
    }
  });

  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", async (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    let statusUpdated = false;
    for (const user of chat.users) {
      if (user._id == newMessageRecieved.sender._id) continue;

      // Simple heuristic for delivered: if user is in a room (connected)
      const clients = io.sockets.adapter.rooms.get(user._id);
      if (clients && clients.size > 0 && !statusUpdated) {
        await Message.findByIdAndUpdate(newMessageRecieved._id, { status: "delivered" });
        newMessageRecieved.status = "delivered";
        statusUpdated = true;
      }

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    }

    if (statusUpdated) {
      socket.emit("message updated", newMessageRecieved);
    }
  });

  socket.on("message seen", async ({ messageId, userId }) => {
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId }, status: "seen" },
      { new: true }
    ).populate("sender", "name pic email").populate("chat");
    
    if (updatedMessage && updatedMessage.chat) {
      updatedMessage.chat.users.forEach((user) => {
        socket.in(user._id).emit("message updated", updatedMessage);
      });
    }
  });

  socket.on("update message", (updatedMessage) => {
    var chat = updatedMessage.chat;
    if (!chat.users) return;

    chat.users.forEach((user) => {
      socket.in(user._id).emit("message updated", updatedMessage);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
