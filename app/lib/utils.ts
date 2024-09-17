import { MantineColor } from "@mantine/core";

export type DbPaginator = {
  skip: number;
  take: number;
};

export function dbPaginator({
  page,
  size = 25,
}: {
  page: number;
  size?: number;
}): DbPaginator {
  if (page <= 1) {
    return { skip: 0, take: size };
  }
  return {
    skip: (page - 1) * size,
    take: size,
  };
}

export function formatDate(
  dateString: string | Date,
  time: boolean = true
): string {
  if (dateString === "null") return "-";
  const date = new Date(dateString);
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const monthNames: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formattedDate = `${day} ${monthNames[monthIndex]} ${year}`;
  const formattedTime = time
    ? ` ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    : "";

  return formattedDate + formattedTime;
}

export type MenuAction<T> =
  | {
      slug: string;
      icon: React.JSX.Element;
      label: string;
      type: "link";
      link: (data: T) => string;
      condition: (data: T) => boolean;
      color?: MantineColor;
    }
  | {
      slug: string;
      icon: React.JSX.Element;
      label: string;
      type: "button";
      action: (data: T) => void;
      condition: (data: T) => boolean;
      color?: MantineColor;
    };
