"use client";

import { destroyCookiesAction } from "@/app/actions";
import useMediaQuery from "@/components/lib/hooks/media-query";
import { useUserContext } from "@/context/UserContext";
import { socket } from "@/socket";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

export default function Header() {
  const { push } = useRouter();
  const { user } = useUserContext();

  const isMobile = useMediaQuery(`(max-width: ${1023}px)`);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  function onConnect() {
    setIsConnected(true);

    socket.emit("subscribeOnMyRooms", { username: user?.username });
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  async function handleSignout() {
    await destroyCookiesAction();
    push("/");
  }

  return (
    <div className="flex items-center justify-between gap-3 w-full py-2 px-5 bg-dark-500">
      <Link className="flex items-center justify-center gap-2" href="/">
        <img className="w-10 h-10" src="/logo.png" alt="logo" />
        <h1 className="text-white font-bold text-2xl max-sm:text-xl">
          Infinity Chat
        </h1>
      </Link>

      <div className="flex items-center justify-end gap-3">
        <div className="flex flex-col">
          <span className="text-white text-sm capitalize ">
            {user?.username}
          </span>
          {isConnected ? (
            <span className="text-green-500 text-xs text-right">Online</span>
          ) : (
            <span className="text-red-500 text-xs text-right">Offline</span>
          )}
        </div>
        <img
          className="w-10 h-10 rounded-full"
          src={`https://avatar.iran.liara.run/username?username=${user?.username}`}
          alt="Avatar"
        />
        <button
          onClick={handleSignout}
          className="flex items-center gap-2 text-white bg-red-500 px-3 py-1 rounded"
        >
          <FaSignOutAlt />
          {!isMobile && `Sign Out`}
        </button>
      </div>
    </div>
  );
}
