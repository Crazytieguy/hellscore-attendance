import type { InferGetStaticPropsType, NextPage } from "next";
import { useSession } from "next-auth/react";
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
  event.title && event.start ? true : false;

export const getStaticProps = async () => {
  const [calendarDataRaw, userEvents] = await Promise.all([
    getHellscoreEvents(),
    getUserEvents(),
  ]);
  const calendarData = calendarDataRaw
    .map((event) => {
      const title = userEvents.find(({ title }) =>
        event.summary?.startsWith(title)
      )?.title;
      const start = event.start?.dateTime;
      return { title, start, isTest: event.isTest };
    })
    .filter(hasTitleAndStart);
  calendarData.forEach((event) => {
    if (event.start) {
      event.start = ISOToHuman(event.start);
    }
  });
  return {
    props: {
      calendarData,
      userEvents,
    },
    revalidate: 10,
  };
};

export default Home;
