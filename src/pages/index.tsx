import type { NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  const submitRow = trpc.sheets.submitAttendance.useMutation();

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
      <main className="mx-auto min-h-screen max-w-screen-md p-4">
        <h1 className="text-center text-3xl font-extrabold leading-normal text-gray-700 md:text-[5rem]">
          Hellscore Attendance!
        </h1>
        <button
          className="rounded-md border border-black bg-violet-50 px-4 py-2 text-xl shadow-lg hover:bg-violet-100"
          onClick={() => submitRow.mutateAsync(["Hello from my app!"])}
        >
          Add Message
        </button>
        <button
          className="rounded-md border border-black bg-violet-50 px-4 py-2 text-xl shadow-lg hover:bg-violet-100"
          onClick={sessionData ? () => signOut() : () => signIn()}
        >
          {sessionData ? "Sign out" : "Sign in"}
        </button>
      </main>
    </>
  );
};

export default Home;
