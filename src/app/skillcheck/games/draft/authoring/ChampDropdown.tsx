"use client";

import { useEffect, useState } from "react";
import SearchDropdown, {
  DropdownItem,
} from "@/app/_components/small/SearchDropdown";
import { getAllChampions, champSquareUrlById } from "@/lib/datadragon/champions";

type Champ = { id: string; name: string };

export default function ChampionDropdown({
  value,
  onChange,
}: {
  value: string | null;          // champion id (e.g. "MonkeyKing")
  onChange: (champ: string) => void; // champion id
}) {
  const [items, setItems] = useState<DropdownItem<string>[]>([]);

  useEffect(() => {
    getAllChampions().then((list) => {
      const champs = list as Champ[];

      setItems(
        champs.map((c) => ({
          value: c.id,                 // unique string key
          label: c.name,               // display name
          icon: champSquareUrlById(c.id), // use id directly for images
        }))
      );
    });
  }, []);

  return (
    <SearchDropdown
      items={items}
      value={value}
      onChange={onChange}
      placeholder="Select champion"
    />
  );
}
