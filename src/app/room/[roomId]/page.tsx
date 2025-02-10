"use client";
import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FaArrowAltCircleLeft, FaTrash, FaEdit } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ReactTinyLink } from "react-tiny-link";

import { socket } from "@/socket";
import { axiosApp } from "@/configs/servers/axios";
import { useUserContext } from "@/context/UserContext";

import useMediaQuery from "@/components/lib/hooks/media-query";
import Button from "@/components/elements/button";
import Input from "@/components/elements/input";
import Spinner from "@/components/elements/spinner";

import { Message } from "@/types/messages";

export default function RoomMessage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId;

  const { push } = useRouter();
  const { user } = useUserContext();

  const isMobile = useMediaQuery(`(max-width: ${1023}px)`);

  const messageListRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [openPreview, setOpenPreview] = useState(false);

  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editMessageId, setEditMessageId] = useState<null | string>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    socket.on("userJoined", (newUsername) => {
      const joinMessage = {
        username: "System",
        text: `"${newUsername}" joined the room`,
        roomId,
      };

      socket.emit("sendMessage", joinMessage);

      setUsers((prevUsers) => [...prevUsers, newUsername]);
    });

    setIsLoading(true);

    axiosApp(`/api/messages/${roomId}`).then(async ({ data }) => {
      setMessages(data);
      setIsLoading(false);

      await new Promise((resolve) => setTimeout(resolve, 200));

      messageListRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    socket.on("userLeft", (newUsername) => {
      const leaveMessage = {
        username: "System",
        text: `"${newUsername}" left the room`,
        roomId,
      };

      socket.emit("sendMessage", leaveMessage);

      setUsers((prevUsers) => prevUsers.filter((user) => user !== newUsername));
    });

    socket.on("newMessage", async (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);

      if (Notification.permission === "granted") {
        new Notification("New Message", {
          body: `${msg.username}: ${msg.text}`,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      messageListRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    socket.on("messageEdited", (updatedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on("messageRemoved", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    socket.emit("getRoomUsers", roomId, (roomUsers: string[]) => {
      setUsers(roomUsers);
    });

    return () => {
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageRemoved");
      socket.off("getRoomUsers");
    };
  }, []);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.username || !inputValue) return;

    if (editMessageId) {
      socket.emit("editMessage", {
        messageId: editMessageId,
        newText: inputValue,
      });

      setInputValue("");
      setEditMessageId(null);
      setIsEditingMessage(false);

      return;
    }

    const socketMsg = {
      username: user.username,
      text: inputValue,
      roomId,
    };

    socket.emit("sendMessage", socketMsg);

    setInputValue("");
    setOpenPreview(false);
  }

  function leaveRoom() {
    socket.emit("leaveRoom", { roomId, username: user?.username });

    push("/");
  }

  function renderMessageText(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    console.log(parts);

    return parts.map((part, index) =>
      urlRegex.test(part) ? (
        <ReactTinyLink
          key={index}
          cardSize="small"
          showGraphic={true}
          maxLine={2}
          minLine={1}
          url={part}
        />
      ) : (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {part}
        </ReactMarkdown>
      )
    );
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function removeMessage(messageId: string) {
    if (confirm("Are you sure you want to delete this message?")) {
      socket.emit("removeMessage", { messageId });
    }
  }

  function handleEditMessage(msg: Message) {
    setEditMessageId(msg._id);
    setInputValue(msg.text);
    setIsEditingMessage(true);
  }

  return (
    <div className="flex h-full items-start justify-start max-lg:flex-col">
      <div className="flex flex-col justify-between bg-dark-800 w-1/5 h-full px-2 max-lg:w-full max-lg:h-full max-lg:p-2 ">
        {isMobile ? (
          <div className="flex w-full items-center justify-between h-full">
            <h3 className="flex w-full items-center gap-1 text-white font-bold text-xl">
              <Link href="/">
                <FaArrowAltCircleLeft />
              </Link>
              Users{" "}
              {!isLoading && <span className="text-sm">({users.length})</span>}
            </h3>

            <Button className="w-1/4" onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full">
            <h3 className="flex w-full items-center justify-between gap-1 text-white font-bold text-3xl pt-3 pl-3">
              <Link href="/">
                <FaArrowAltCircleLeft />
              </Link>
              <div className="flex items-center gap-1">
                Users{" "}
                {!isLoading && (
                  <span className="text-sm">({users.length})</span>
                )}
              </div>
            </h3>
            <div className="flex flex-col w-full h-full gap-3 my-4 striped overflow-auto mb-auto">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                users.map((user) => (
                  <li
                    key={user}
                    className="flex w-full items-center p-3 text-white"
                  >
                    <strong>{user}</strong>
                  </li>
                ))
              )}
            </div>
            <Button className="w-full mb-2 " onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col w-4/5 h-full max-lg:w-full max-lg:h-[calc(100%-65px)] ">
        <ul className="flex flex-col w-full h-full gap-3 my-4 striped overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Spinner />
            </div>
          ) : messages.length ? (
            messages.map((msg) => (
              <li key={msg._id} className="flex w-full items-center text-white">
                <div
                  className={`
                      flex w-full items-start gap-2  p-3
                      relative *:hover:flex
                      ${
                        msg.username === user?.username
                          ? "justify-end"
                          : "justify-start"
                      } 
                      ${msg.username === "System" && "text-gray-500"}
                    `}
                >
                  <div
                    className={`flex flex-col ${
                      msg._id !== editMessageId && isEditingMessage
                        ? "text-dark-500"
                        : ""
                    }`}
                  >
                    <strong
                      className={`${
                        msg.username === user?.username && "hidden"
                      }`}
                    >
                      {msg.username}:
                    </strong>
                    <span
                      className={` text-xs text-gray-500 
                        ${msg.username === user?.username && "hidden"}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col ${
                      msg._id !== editMessageId && isEditingMessage
                        ? "text-dark-500"
                        : ""
                    }`}
                  >
                    <span>
                      {renderMessageText(
                        msg._id === editMessageId ? inputValue : msg.text
                      )}
                    </span>
                    <span
                      className={`text-xs text-gray-500 text-right ${
                        msg.username !== user?.username && "hidden"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {msg.username === user?.username && !editMessageId && (
                    <div className="hidden absolute -top-4 gap-1">
                      <button
                        className="bg-dark-600 p-1 rounded"
                        onClick={() => handleEditMessage(msg)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="bg-dark-600 p-1 rounded"
                        onClick={() => removeMessage(msg._id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <span className="flex w-full h-full items-center justify-center font-semibold text-white text-2xl pt-3 pl-3">
              No messages yet
            </span>
          )}
          <div ref={messageListRef} />
        </ul>
        <form onSubmit={sendMessage} className="flex flex-col gap-2 py-3 px-2">
          <div
            className={`w-full p-2 bg-gray-800 text-white rounded ${
              openPreview ? "" : "hidden"
            }`}
          >
            <span>{renderMessageText(inputValue)}</span>
          </div>

          <div className="flex w-full gap-2 py-3 px-2 max-sm:flex-col">
            <div className="flex w-full gap-2">
              <Input
                required
                className="w-full"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
              />

              <Button className="w-1/5" type="submit">
                Send
              </Button>
            </div>

            <Button
              className="w-2/6 max-sm:order-1 max-sm:w-full"
              type="button"
              onClick={() => setOpenPreview(!openPreview)}
            >
              Preview Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
