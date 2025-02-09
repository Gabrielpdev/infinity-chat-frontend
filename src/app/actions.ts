"use server";
import { cookies } from "next/headers";

export async function setCookiesAction({
  token,
  user,
}: {
  token: string;
  user: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set("[InfinityChat]:token", token);
  cookieStore.set("[InfinityChat]:user", JSON.stringify(user));
}

export async function getCookiesAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("[InfinityChat]:token");
  const user = cookieStore.get("[InfinityChat]:user")?.value;

  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
}

export async function destroyCookiesAction() {
  const cookieStore = await cookies();

  cookieStore.delete("[InfinityChat]:token");
  cookieStore.delete("[InfinityChat]:user");
}
