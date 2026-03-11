import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  IconButton,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

function Homepage() {
  const history = useHistory();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) history.push("/chats");
  }, [history]);

  return (
    <Container maxW="xl" centerContent>
      <Box
        d="flex"
        justifyContent="space-between"
        alignItems="center"
        p={3}
        bg={useColorModeValue("white", "gray.800")}
        color={useColorModeValue("black", "white")}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
      >
        <Text fontSize="4xl" fontFamily="Work sans" fontWeight="bold">
          Sync-Chat
        </Text>
        <IconButton
          variant="ghost"
          onClick={toggleColorMode}
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          aria-label="Toggle Theme"
        />
      </Box>
      <Box
        bg={useColorModeValue("white", "gray.800")}
        color={useColorModeValue("black", "white")}
        w="100%"
        p={4}
        borderRadius="lg"
        borderWidth="1px"
      >
        <Tabs isFitted variant="soft-rounded">
          <TabList mb="1em">
            <Tab>Login</Tab>
            <Tab>Sign Up</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default Homepage;
