import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  Input,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { ChevronDownIcon, CheckIcon } from "@chakra-ui/icons";
import axios from "axios";
import React, { useState } from "react";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const ScrollableChat = ({ messages, setMessages, socket, selectedChat }) => {
  const { user } = ChatState();
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const toast = useToast();
  const systemMsgColor = useColorModeValue("gray.600", "gray.300");
  const chevronBg = useColorModeValue("gray.100", "gray.700");
  const menuBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("black", "white");

  const deleteMessage = async (messageId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.delete(
        `/api/message/delete/${messageId}`,
        config,
      );
      setMessages(messages.map((m) => (m._id === messageId ? data : m)));
      if (socket) socket.emit("update message", data);
    } catch (error) {
      toast({
        title: "Error!",
        description:
          error.response?.data?.message || "Failed to delete message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const editMessage = async (messageId) => {
    if (!editContent) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        "/api/message/edit",
        { messageId, content: editContent },
        config,
      );
      setMessages(messages.map((m) => (m._id === messageId ? data : m)));
      if (socket) socket.emit("update message", data);
      setEditingMessage(null);
    } catch (error) {
      toast({
        title: "Error!",
        description: error.response?.data?.message || "Failed to edit message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        "/api/message/react",
        { messageId, emoji },
        config,
      );
      setMessages(messages.map((m) => (m._id === messageId ? data : m)));
      if (socket) socket.emit("update message", data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div key={m._id}>
            {m.isSystemMessage ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "10px 0",
                }}
              >
                <span
                  style={{
                    backgroundColor: "rgba(0,0,0,0.1)",
                    color: systemMsgColor,
                    padding: "2px 10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontStyle: "italic",
                  }}
                >
                  {m.content}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", position: "relative" }}>
                {(isSameSender(messages, m, i, user?._id) ||
                  isLastMessage(messages, i, user?._id)) && (
                  <Tooltip
                    label={m.sender.name}
                    placement="bottom-start"
                    hasArrow
                  >
                    <Avatar
                      mt="7px"
                      mr={1}
                      size="sm"
                      cursor="pointer"
                      name={m.sender.name}
                      src={m.sender.pic}
                    />
                  </Tooltip>
                )}
                <Box
                  position="relative"
                  group="true"
                  display="flex"
                  flexDirection="column"
                  alignItems={
                    m.sender._id === user?._id ? "flex-end" : "flex-start"
                  }
                  w="100%"
                  ml={isSameSenderMargin(messages, m, i, user?._id)}
                  mt={isSameUser(messages, m, i, user?._id) ? 1 : 3}
                >
                  <Box
                    backgroundColor={
                      m.isDeleted
                        ? "transparent"
                        : m.sender._id === user?._id
                          ? "#BEE3F8"
                          : "#B9F5D0"
                    }
                    color="black"
                    borderRadius="20px"
                    padding="5px 15px"
                    maxWidth="85%"
                    border={m.isDeleted ? "1px solid gray" : "none"}
                    position="relative"
                    role="group"
                  >
                    {editingMessage === m._id ? (
                      <HStack>
                        <Input
                          size="sm"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && editMessage(m._id)
                          }
                        />
                        <IconButton
                          size="xs"
                          aria-label="Save Edit"
                          icon={<Text fontSize="xs">Save</Text>}
                          onClick={() => editMessage(m._id)}
                        />
                        <IconButton
                          size="xs"
                          aria-label="Cancel Edit"
                          icon={<Text fontSize="xs">X</Text>}
                          onClick={() => setEditingMessage(null)}
                        />
                      </HStack>
                    ) : (
                      <>
                        <Text
                          fontStyle={m.isDeleted ? "italic" : "normal"}
                          color={m.isDeleted ? "gray.500" : "black"}
                        >
                          {m.content}
                        </Text>
                        <Flex justifyContent="flex-end" alignItems="center" mt={1}>
                          {!m.isDeleted && m.isEdited && (
                            <Text fontSize="9px" color="gray.500" mr={1}>
                              (edited)
                            </Text>
                          )}
                          <Text fontSize="9px" color="gray.600" mr={1}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          {m.sender._id === user?._id && !m.isDeleted && (
                            <HStack spacing={-1}>
                              <CheckIcon 
                                boxSize={2} 
                                color={m.status === "seen" ? "blue.500" : "gray.600"} 
                              />
                              {(m.status === "delivered" || m.status === "seen") && (
                                <CheckIcon 
                                  boxSize={2} 
                                  color={m.status === "seen" ? "blue.500" : "gray.600"} 
                                />
                              )}
                            </HStack>
                          )}
                        </Flex>
                      </>
                    )}

                    {!m.isDeleted && (
                      <Box
                        position="absolute"
                        top="-20px"
                        right={m.sender._id === user?._id ? "100%" : "auto"}
                        left={m.sender._id === user?._id ? "auto" : "100%"}
                        opacity="0"
                        _groupHover={{ opacity: "1" }}
                        transition="opacity 0.2s"
                        display="flex"
                        bg={chevronBg}
                        borderRadius="md"
                        boxShadow="md"
                        zIndex="1"
                        color={textColor}
                      >
                        <Menu isLazy>
                          <MenuButton
                            as={IconButton}
                            aria-label="Message Options"
                            icon={<ChevronDownIcon />}
                            variant="ghost"
                            color={textColor}
                          />
                          <MenuList minW="70px" bg={menuBg} color={textColor}>
                            <Box
                              p={2}
                              display="flex"
                              justifyContent="space-around"
                            >
                              {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(
                                (emoji) => (
                                  <Text
                                    key={emoji}
                                    cursor="pointer"
                                    onClick={() => reactToMessage(m._id, emoji)}
                                    _hover={{ transform: "scale(1.2)" }}
                                  >
                                    {emoji}
                                  </Text>
                                ),
                              )}
                            </Box>
                            {m.sender._id === user?._id && (
                              <>
                                <MenuItem
                                  onClick={() => {
                                    setEditingMessage(m._id);
                                    setEditContent(m.content);
                                  }}
                                  fontSize="sm"
                                >
                                  Edit
                                </MenuItem>
                                <MenuItem
                                  onClick={() => deleteMessage(m._id)}
                                  fontSize="sm"
                                  color="red.500"
                                >
                                  Delete
                                </MenuItem>
                              </>
                            )}
                          </MenuList>
                        </Menu>
                      </Box>
                    )}
                  </Box>

                  {m.reactions && m.reactions.length > 0 && (
                    <Flex
                      mt="-10px"
                      zIndex="2"
                      bg={menuBg}
                      borderRadius="full"
                      boxShadow="xs"
                      px={1}
                      color={textColor}
                    >
                      {Array.from(new Set(m.reactions.map((r) => r.emoji))).map(
                        (emoji) => (
                          <Tooltip
                            key={emoji}
                            label={m.reactions
                              .filter((r) => r.emoji === emoji)
                              .map((r) => r?.user?.name || "Unknown")
                              .join(", ")}
                          >
                            <Text fontSize="xs" mr={1}>
                              {emoji}
                            </Text>
                          </Tooltip>
                        ),
                      )}
                      <Text fontSize="10px" color="gray.500" alignSelf="center">
                        {m.reactions.length}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </div>
            )}
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
