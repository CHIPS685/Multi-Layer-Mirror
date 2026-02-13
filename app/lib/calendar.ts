import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { monthRangeDateIds } from "./date";

export type DayMark = {
  hasFragments: boolean;
  hasDiary: boolean;
  hasPhotos?: boolean;
};

type Args = {
  uid: string;
  monthId: string;
};

export async function getMonthMarks(args: Args): Promise<Record<string, DayMark>> {
  const { uid, monthId } = args;
  const { startDateId, endDateId } = monthRangeDateIds(monthId);

  const result: Record<string, DayMark> = {};

  const fragmentsRef = collection(db, "users", uid, "fragments");
  const fragmentsQ = query(
    fragmentsRef,
    where("dateId", ">=", startDateId),
    where("dateId", "<=", endDateId),
  );

  const fragmentsSnap = await getDocs(fragmentsQ);
  fragmentsSnap.forEach((doc) => {
    const d = doc.data() as any;
    const dateId = d?.dateId;
    if (typeof dateId !== "string") return;
    if (!result[dateId]) result[dateId] = { hasFragments: false, hasDiary: false };
    result[dateId].hasFragments = true;
  });

  return result;
}
