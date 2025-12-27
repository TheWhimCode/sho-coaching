"use client";

import { useEffect, useState } from "react";
import SearchDropdown, {
  DropdownItem,
} from "@/app/_components/small/SearchDropdown";
import {
  getAllChampions,
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/datadragon/champions";

export default function ChampionDropdown({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (champ: string) => void;
}) {
  const [items, setItems] = useState<
    DropdownItem<string>[]
  >([]);

  useEffect(() => {
    getAllChampions().then((list) => {
      setItems(
        list.map((name) => ({
          value: name,
          label: name,
          icon: champSquareUrlById(
            resolveChampionId(name)
          ),
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
