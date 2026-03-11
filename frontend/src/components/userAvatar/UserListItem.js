import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { useColorModeValue } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  const bg = useColorModeValue("#E8E8E8", "gray.700");
  const color = useColorModeValue("black", "white");

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg={bg}
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      color={color}
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Avatar
        mr={2}
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.pic}
      />
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize="xs">
          <b>Email : </b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
