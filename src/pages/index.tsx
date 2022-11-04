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
        <p>אנה התחבר/י כדי למלא את התופס 🙂</p>
      )}
    </Layout>
  );
};

const hasTitleAndStart = (event: {
  title: string | undefined;
  start: string | null | undefined;
}): event is { title: string; start: string } =>
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
      return { title, start };
    })
    .filter(hasTitleAndStart);
  calendarData.forEach((event) => (event.start = ISOToHuman(event.start)));
  console.log(calendarData);
  return {
    props: {
      calendarData,
      userEvents,
    },
    revalidate: 10,
  };
};

export default Home;
