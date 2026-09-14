import { notFound } from "next/navigation";
import { DAYS } from "@/data/program";
import DayView from "@/components/DayView";

export function generateStaticParams() {
  return DAYS.map((d) => ({ day: d.id }));
}

export default async function DayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day: dayId } = await params;
  const day = DAYS.find((d) => d.id === dayId);
  if (!day) notFound();

  return <DayView day={day} />;
}
