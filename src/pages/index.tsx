import type { InferGetStaticPropsType, NextPage } from "next";
import { useSession } from "next-auth/react";
import { filter, find, forEach, map, startsWith } from "lodash";

import {
  getHellscoreEvents,
  getSheetContent as getUserEvents,
} from "../server/googleApis";
import Layout from "../components/Layout";
import AttendanceForm from "../components/AttendanceForm";
import { ISOToHuman } from "../utils/dates";

const Home: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  calendarData,
  userEvents,
}) => {
  const { data: session } = useSession();

  return (
    <Layout>
      {session ? (
        <AttendanceForm {...{ calendarData, userEvents, session }} />
      ) : (
        <p>אנא התחבר/י כדי למלא את הטופס 🙂</p>
      )}
    </Layout>
  );
};

const hasTitleAndStart = (event: {
  title: string | undefined;
  start: string | null | undefined;
  isTest?: boolean;
}): event is { title: string; start: string; isTest?: boolean } =>
  Boolean(event.title && event.start);

export const getStaticProps = async () => {
  const [calendarDataRaw, userEvents] = await Promise.all([
    getHellscoreEvents(),
    getUserEvents(),
  ]);
  const calendarData = filter(
    map(calendarDataRaw, (event) => {
      const title = find(userEvents, ({ title }) =>
        startsWith(event.summary || "", title)
      )?.title;
      const start = event.start?.dateTime;
      return { title, start, isTest: Boolean(event.isTest) };
    }),
    hasTitleAndStart
  );
  forEach(calendarData, (event) => {
    if (event.start) {
      event.start = ISOToHuman(event.start);
    }
  });
  return {
    props: { calendarData, userEvents },
    revalidate: 10,
  };
};

export default Home;
