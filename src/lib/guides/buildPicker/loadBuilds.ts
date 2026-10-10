import { ensureItemsData, getItem, itemIconUrlFromPath } from "@/lib/datadragon/items";
import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";
import { pickerBuildDefs, type PickerBuild } from "./builds";

/** Server-side: resolve item names and icons for every picker build. */
export async function loadPickerBuilds(config: GuideItemSectionConfig): Promise<PickerBuild[]> {
  await ensureItemsData();
  return pickerBuildDefs(config).map(({ itemIds, ...def }) => ({
    ...def,
    items: itemIds.map((id) => {
      const row = getItem(String(id));
      return {
        id,
        name: row?.name ?? String(id),
        icon: itemIconUrlFromPath(row?.iconPath),
      };
    }),
  }));
}
