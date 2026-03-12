import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Box,
  Text,
  VStack,
  Avatar,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";

const GroupMembersModal = ({ children, users, chatName, admin }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="30px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {chatName} Members
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack
              spacing={3}
              align="stretch"
              maxH="60vh"
              overflowY="auto"
              p={2}
            >
              {users.map((u) => (
                <Box
                  key={u._id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={2}
                  borderRadius="lg"
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                >
                  <Box display="flex" alignItems="center">
                    <Avatar size="sm" mr={3} name={u.name} src={u.pic} />
                    <Box>
                      <Text fontWeight="bold">{u.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {u.email}
                      </Text>
                    </Box>
                  </Box>
                  {admin && u._id === admin._id && (
                    <Badge colorScheme="green" ml={2}>
                      Admin
                    </Badge>
                  )}
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupMembersModal;
