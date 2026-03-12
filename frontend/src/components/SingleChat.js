import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import {
  IconButton,
  Spinner,
  useToast,
  useColorModeValue,
  Button,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, HamburgerIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import GroupMembersModal from "./miscellaneous/GroupMembersModal";
import { ChatState } from "../Context/ChatProvider";
import backImg from "../BackImg.png";
const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState("");
  const isMounted = useRef(true);
  const toast = useToast();
  const boxBg = useColorModeValue("#E8E8E8", "gray.800");
  const boxColor = useColorModeValue("black", "white");
  const inputBg = useColorModeValue("#E0E0E0", "gray.700");
  const backBtnBg = useColorModeValue("gray.200", "gray.600");
  const backBtnHoverBg = useColorModeValue("gray.300", "gray.500");
  const chatBgImage = useColorModeValue("none", `url(${backImg})`);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const markAsSeen = (msg) => {
  if (!msg?.sender?._id) return;

  if (msg.sender._id !== user._id && !msg?.readBy?.includes(user._id)) {
    socket.emit("message seen", { messageId: msg._id, userId: user._id });
  }
};

  const fetchMessages = async () => {
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
        config,
      );
      if (isMounted.current) {
        setMessages(data);
        setLoading(false);
      }

      socket.emit("join chat", selectedChat._id);

      // Mark unread messages as seen
      data.forEach((msg) => markAsSeen(msg));
    } catch (error) {
  console.log("FULL ERROR:", error);
  console.log("ERROR RESPONSE:", error.response);
  console.log("ERROR DATA:", error.response?.data);

  if (isMounted.current) {
    setLoading(false);
    toast({
      title: "Error Occured!",
      description: "Failed to Load the Messages",
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
  }
}
  };

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
          config,
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
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

  const clearChat = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      if (isMounted.current) {
        setLoading(true);
      }
      await axios.delete(`/api/message/${selectedChat._id}`, config);
      if (isMounted.current) {
        setMessages([]);
        setLoading(false);
      }
      setFetchAgain(!fetchAgain);
      toast({
        title: "Chat Cleared",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to clear the chat",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", (name) => {
      setTypingName(name || "");
      setIsTyping(true);
      if (isMounted.current) {
        setTypingName(name || "");
        setIsTyping(true);
      }
    });
    socket.on("stop typing", () => {
      if (isMounted.current) {
        setIsTyping(false);
        setTypingName("");
      }
    });

    return () => {
      isMounted.current = false; // Cleanup for isMounted ref
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
        markAsSeen(newMessageRecieved);
      }
    });

    socket.on("message updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      );
    });

    return () => {
      socket.off("message recieved");
      socket.off("message updated");
    };
  }, [messages]);

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
        <>
          <Box
            fontSize={{ base: "22px", md: "24px" }}
            fontWeight="bold"
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center">
              <IconButton
                display="flex"
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat("")}
                aria-label="Back"
                mr={2}
                bg={backBtnBg}
                _hover={{ bg: backBtnHoverBg }}
                color={boxColor}
              />
              {!selectedChat.isGroupChat
                ? getSender(user, selectedChat.users)
                : selectedChat.chatName}
            </Box>
            <Box display="flex">
              {messages &&
                (!selectedChat.isGroupChat ? (
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                ) : (
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                ))}
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Options"
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  ml={1}
                  color={boxColor}
                />
                <MenuList color={boxColor}>
                  {selectedChat.isGroupChat && (
                    <GroupMembersModal
                      users={selectedChat.users}
                      chatName={selectedChat.chatName}
                      admin={selectedChat.groupAdmin}
                    >
                      <MenuItem fontSize="md" fontWeight="semibold">
                        See all members
                      </MenuItem>
                    </GroupMembersModal>
                  )}
                  <MenuItem
                    fontSize="md"
                    fontWeight="semibold"
                    onClick={clearChat}
                  >
                    Clear Conversation
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
          </Box>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={boxBg}
            backgroundImage={chatBgImage}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            color={boxColor}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  setMessages={setMessages}
                  socket={socket}
                  selectedChat={selectedChat}
                />
              </div>
            )}

            <FormControl id="first-name" isRequired mt={3}>
              {istyping ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontStyle="italic"
                    mr={2}
                  >
                    {selectedChat.isGroupChat && typingName
                      ? `${typingName} is typing...`
                      : "Typing..."}
                  </Text>
                  <Lottie
                    options={defaultOptions}
                    width={50}
                    style={{ marginLeft: 0, marginButton: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <InputGroup>
                <Input
                  variant="filled"
                  bg={inputBg}
                  placeholder="Enter a message.."
                  value={newMessage}
                  onChange={typingHandler}
                  onKeyDown={sendMessage}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    colorScheme="teal"
                    onClick={sendMessage}
                  >
                    Send
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="2xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
