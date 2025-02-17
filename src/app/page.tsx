"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { axiosApp } from "@/configs/servers/axios";
import Button from "@/components/elements/button";
import Input from "@/components/elements/input";
import { socket } from "@/socket";
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Room, UserRoom } from "@/types/rooms";
import Spinner from "@/components/elements/spinner";
import Image from "next/image";

export default function Home() {
  const { push } = useRouter();
  const messageRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingJoinedRooms, setIsLoadingJoinedRooms] = useState(false);

  const { user } = useUserContext();

  useEffect(() => {
    setIsLoadingRooms(true);
    setIsLoadingJoinedRooms(true);

    axiosApp(`/api/rooms/myrooms`).then(({ data }) => {
      setUserRooms(data);
      setIsLoadingJoinedRooms(false);
    });

    socket.on("newRoom", (data) => {
      setRooms((prevRooms) => [...prevRooms, data]);
      setIsLoadingRooms(false);
    });

    axiosApp(`/api/rooms/list`).then(({ data }) => {
      setRooms(data);
      setIsLoadingRooms(false);
    });

    return () => {
      socket.off("newRoom");
    };
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();

    if (!messageRef.current?.value) return;

    socket.emit("createRoom", {
      name: messageRef.current?.value,
    });

    messageRef.current.value = "";
  }

  async function joinRoom(room: { _id: string; name: string }) {
    socket.emit("joinRoom", {
      roomId: room._id,
      roomName: room.name,
      username: user?.username,
    });

    push(`/room/${room._id}`);
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col bg-dark-800 w-1/5 h-full max-xl:w-2/5  max-sm:w-full">
        <h3 className="text-white font-bold text-4xl pt-3 pl-3">Rooms</h3>

        <form onSubmit={createRoom} className="flex gap-2 py-3 px-2">
          <Input className="w-2/3" type="text" ref={messageRef} />
          <Button className="w-1/3" type="submit">
            Create Room
          </Button>
        </form>

        <ul className="flex flex-col justify-center gap-3 my-4 striped">
          {isLoadingRooms ? (
            <div className="flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            rooms
              .filter(
                (room) =>
                  !userRooms.map(({ roomId }) => roomId).includes(room._id)
              )
              .map((room) => (
                <li
                  key={room._id}
                  className="flex gap-2 items-center justify-between p-3"
                >
                  <span className="text-white font-bold">{room.name}</span>
                  <Button onClick={() => joinRoom(room)}>Join Room</Button>
                </li>
              ))
          )}
        </ul>
      </div>

      <div className="flex flex-col justify-center items-center w-4/5 h-full max-xl:w-3/5 max-sm:hidden">
        {isLoadingJoinedRooms ? (
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        ) : userRooms.length ? (
          <div className="flex flex-col items-center w-full h-full ">
            <h2 className="mb-5 text-white text-center font-bold text-4xl pt-3 pl-3 w-full max-md:text-2xl">
              Rooms Joined
            </h2>
            <ul className="w-full striped">
              {userRooms.map((room) => (
                <li
                  key={room._id}
                  className="flex gap-2 items-center p-3 striped"
                >
                  <span className="text-white ">{room.roomName}</span>
                  <Link
                    className="bg-highlight-500 p-2 rounded-md text-white"
                    href={`/room/${room.roomId}`}
                  >
                    Enter
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <Image src="/logo.png" alt="logo" width={100} height={100} />
            <h2 className="text-white text-center font-bold text-4xl pt-3 pl-3 max-md:text-2xl">
              Welcome to Infinity Chat
            </h2>
            <span className="text-white text-center text-2xl pt-3 pl-3 max-md:text-xl">
              Select a room or create a new one to start chatting!
            </span>
          </>
        )}
      </div>
    </div>
  );
}
