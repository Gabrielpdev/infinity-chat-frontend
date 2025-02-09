"use client";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/elements/button";
import Input from "@/components/elements/input";
import useMediaQuery from "@/components/lib/hooks/media-query";
import { useUserContext } from "@/context/UserContext";
import { socket } from "@/socket";
import { Message } from "@/types/messages";
import { useParams, useRouter } from "next/navigation";
import { axiosApp } from "@/configs/servers/axios";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import Link from "next/link";

export default function RoomMessage() {
  const params = useParams<{ roomId: string }>();
  const { push } = useRouter();
  const { user } = useUserContext();

  const isMobile = useMediaQuery(`(max-width: ${1023}px)`);

  const messageRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId] = useState(params?.roomId);
  const [users, setUsers] = useState<string[]>([]);

  console.log({ users });

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    axiosApp(`/api/messages/${roomId}`).then(async ({ data }) => {
      setMessages(data);

      await new Promise((resolve) => setTimeout(resolve, 100));
      messageListRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    socket.on("userJoined", (newUsername) => {
      const joinMessage = {
        username: "System",
        text: `"${newUsername}" joined the room`,
        roomId,
      };

      socket.emit("sendMessage", joinMessage);

      setUsers((prevUsers) => [...prevUsers, newUsername]);
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

      await new Promise((resolve) => setTimeout(resolve, 100));
      messageListRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });

    socket.emit("getRoomUsers", roomId, (roomUsers: string[]) => {
      setUsers(roomUsers);
    });
  }, []);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!messageRef.current?.value) return;

    const socketMsg = {
      username: user?.username,
      text: messageRef.current.value,
      roomId,
    };

    socket.emit("sendMessage", socketMsg);

    messageRef.current.value = "";
  }

  function leaveRoom() {
    socket.off("userJoined");
    socket.off("userLeft");
    socket.off("messageHistory");
    socket.off("newMessage");

    socket.emit("leaveRoom", { roomId, username: user?.username });
    push("/");

    if (messageRef.current) {
      messageRef.current.value = "";
    }
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
              Users <span className="text-sm">({users.length})</span>
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
                Users <span className="text-sm">({users.length})</span>
              </div>
            </h3>
            <div className="flex flex-col w-full h-full gap-3 my-4 striped overflow-auto mb-auto">
              {users.map((user) => (
                <li
                  key={user}
                  className="flex w-full items-center p-3 text-white"
                >
                  <strong>{user}</strong>
                </li>
              ))}
            </div>
            <Button className="w-full mb-2 " onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col w-4/5 h-full max-lg:w-full max-lg:h-[calc(100%-65px)] ">
        <ul className="flex flex-col w-full h-full gap-3 my-4 striped overflow-auto">
          {messages.length ? (
            messages.map((msg) => (
              <li
                key={msg._id}
                className="flex w-full items-center p-3 text-white"
              >
                <div
                  className={`flex w-full items-center gap-2 ${
                    msg.username === user?.username
                      ? "justify-end"
                      : "justify-start"
                  } ${msg.username === "System" && "text-gray-500"}`}
                >
                  <span
                    className={` text-xs text-gray-500 ${
                      msg.username === user?.username ? "order-3" : ""
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                  <strong
                    className={`${msg.username === user?.username && "hidden"}`}
                  >
                    {msg.username}:
                  </strong>

                  <span>{msg.text}</span>
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
        <form onSubmit={sendMessage} className="flex gap-2 py-3 px-2">
          <Input className="w-3/4" type="text" ref={messageRef} />
          <Button className="w-1/4" type="submit">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
