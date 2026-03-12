import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";

import {
  Spinner,
  useToast,
  Button,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";

import { getSender } from "../config/ChatLogics";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);

  const isMounted = useRef(true);

  const toast = useToast();

  const { selectedChat, user, notification, setNotification } =
    ChatState();

  const markAsSeen = useCallback((msg) => {
  if (!msg?.sender?._id) return;

  if (msg.sender._id !== user._id && !msg?.readBy?.includes(user._id)) {
    socket.emit("message seen", { messageId: msg._id, userId: user._id });
  }
}, [user]);

  const fetchMessages = useCallback(async () => {
  if (!selectedChat) return;

  try {
    const config = {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    setLoading(true);

    const { data } = await axios.get(
      `/api/message/${selectedChat._id}`,
      config
    );

    if (isMounted.current) {
      setMessages(data);
      setLoading(false);
    }

    socket.emit("join chat", selectedChat._id);

    data.forEach((msg) => markAsSeen(msg));
  } catch (error) {
    setLoading(false);
  }
}, [selectedChat, user, markAsSeen]);

  const sendMessage = async (event) => {
    if ((event.type === "click" || event.key === "Enter") && newMessage) {
      socket.emit("stop typing", selectedChat._id);

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        setNewMessage("");

        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );

        socket.emit("new message", data);

        setMessages((prev) => [...prev, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);

    socket.emit("setup", user);

    socket.on("connected", () => setSocketConnected(true));

    return () => {
      isMounted.current = false;

      if (socket) socket.disconnect();
    };
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  fetchMessages();
  selectedChatCompare = selectedChat;
}, [selectedChat, fetchMessages]);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);

          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);

        markAsSeen(newMessageRecieved);
      }
    });

    socket.on("message updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    });

    return () => {
      socket.off("message recieved");
      socket.off("message updated");
    };
  }, [
    messages,
    notification,
    setNotification,
    fetchAgain,
    setFetchAgain,
  ]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);

      socket.emit("typing", { room: selectedChat._id, user: user.name });
    }

    let lastTypingTime = new Date().getTime();

    var timerLength = 3000;

    setTimeout(() => {
      var timeNow = new Date().getTime();

      var timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);

        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <Box>
          <Box fontSize="2xl" pb={3} fontFamily="Work sans">
            {!selectedChat.isGroupChat
              ? getSender(user, selectedChat.users)
              : selectedChat.chatName}
          </Box>

          {loading ? (
            <Spinner size="xl" />
          ) : (
            <div className="messages">
              <ScrollableChat messages={messages} />
            </div>
          )}

          <FormControl mt={3}>
            <InputGroup>
              <Input
                placeholder="Enter a message..."
                value={newMessage}
                onChange={typingHandler}
                onKeyDown={sendMessage}
              />

              <InputRightElement width="4.5rem">
                <Button size="sm" onClick={sendMessage}>
                  Send
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </Box>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="2xl">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;