"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();
  const isSignedIn = session.status === "authenticated";
  return (
    <div>
      <h1>Hello World</h1>
      {isSignedIn ? (
        <>
          <p>Signed in as {session.data?.user?.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn()}>Sign in</button>
      )}
    </div>
  );
}
