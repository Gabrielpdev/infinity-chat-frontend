"use client";

import Button from "@/components/elements/button";
import Input from "@/components/elements/input";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { axiosApp } from "@/configs/servers/axios";
import { setCookiesAction } from "../actions";
import Image from "next/image";
import { useUserContext } from "@/context/UserContext";

export default function Login() {
  const router = useRouter();
  const { setUser } = useUserContext();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await axiosApp.post("/api/users/login", {
        username,
        password,
      });

      if (response.data) {
        const { token, user } = response.data;

        await setCookiesAction({ token, user });
        setUser(user);
        router.push("/");
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full container m-auto">
      <div className="flex flex-col items-center justify-center">
        <Image src="/logo.png" alt="logo" width={100} height={100} />
        <h2 className="text-white text-center font-bold text-4xl pt-3 pl-3 max-md:text-2xl">
          Welcome to Infinity Chat
        </h2>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 w-2/6 mt-5 max-lg:w-4/6 "
      >
        <Input type="text" name="username" placeholder="Username" />
        <Input type="password" name="password" placeholder="Password" />

        <Button type="submit">Login</Button>
      </form>

      <Link href="sign" className="text-blue-200 mt-3">
        Sign-in
      </Link>
    </div>
  );
}
