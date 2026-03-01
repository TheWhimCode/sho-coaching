"use client";

import { useEffect, useMemo, useState } from "react";
import SearchDropdown, {
  DropdownItem,
} from "@/app/_components/small/SearchDropdown";
import { getAllChampions, champSquareUrlById } from "@/lib/datadragon/champions";

type Champ = { id: string; name: string };

export default function ChampionDropdown({
  value,
  onChange,
  className,
  listClassName,
  placeholderClassName,
  searchClassName,
  itemClassName,
  disabledValues,
  disabled,
}: {
  value: string | null;          // champion id (e.g. "MonkeyKing")
  onChange: (champ: string) => void; // champion id
  className?: string;
  /** Optional class for the open list (e.g. max-h-[240px] no-scrollbar) */
  listClassName?: string;
  /** Optional class for placeholder text (e.g. opacity-50) */
  placeholderClassName?: string;
  /** Optional class for the search input (e.g. h-10 px-3 text-sm) */
  searchClassName?: string;
  /** Optional class for each list item (e.g. h-10 px-3 text-sm) */
  itemClassName?: string;
  /** Champion ids to exclude from the list (e.g. first selection so user can't pick same twice) */
  disabledValues?: string[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState<DropdownItem<string>[]>([]);

  useEffect(() => {
    getAllChampions().then((list) => {
      const champs = list as Champ[];

      const nextItems = champs.map((c) => ({
        value: c.id,
        label: c.name,
        icon: champSquareUrlById(c.id),
      }));
      setItems(nextItems);

      // Preload champ icons so they don't load on scroll
      nextItems.forEach((item) => {
        if (item.icon) {
          const img = new Image();
          img.src = item.icon;
        }
      });
    });
  }, []);

  const filteredItems = useMemo(
    () => (disabledValues?.length ? items.filter((i) => !disabledValues.includes(i.value)) : items),
    [items, disabledValues]
  );

  return (
    <SearchDropdown
      items={filteredItems}
      value={value}
      onChange={onChange}
      placeholder="Select champion"
      className={className}
      listClassName={listClassName}
      placeholderClassName={placeholderClassName}
      searchClassName={searchClassName}
      itemClassName={itemClassName}
      disabled={disabled}
    />
  );
}
