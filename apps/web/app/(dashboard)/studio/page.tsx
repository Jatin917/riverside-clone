// app/studio/page.tsx
"use server";

import { redirect } from 'next/navigation';
import { AUTH_OPTIONS } from "app/libs/auth";
import { getServerSession } from "next-auth";
import { getOrCreateStudioByEmail } from "@lib/studio"; // Adjust path based on your setup

const Page = async () => {
  const session = await getServerSession(AUTH_OPTIONS);

  if (!session || !session.user?.email) {
    console.log("User needs to be authenticated first");
    redirect("/login");
  }

  const studio = await getOrCreateStudioByEmail(session.user.email);
  redirect(`/studio/${studio.slugId}`);
};

export default Page;
