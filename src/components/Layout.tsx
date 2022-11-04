import { signOut, signIn, useSession } from "next-auth/react";
import Head from "next/head";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>Hellscore Attendance</title>
        <meta name="description" content="Hellscore attendance" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>❤️‍🔥</text></svg>"
        />
      </Head>
      <div className="mx-auto min-h-screen max-w-screen-sm p-4" dir="rtl">
        <header className="flex justify-between py-4 align-middle">
          <h1 className="text-3xl font-extrabold leading-normal">
            סקר נוכחות הלסקור!
          </h1>
          <button
            className="btn"
            onClick={session ? () => signOut() : () => signIn("google")}
          >
            {session ? "התנתק/י" : "התחבר/י"}
          </button>
        </header>
        <main className="pt-6">{children}</main>
      </div>
    </>
  );
};

export default Layout;
