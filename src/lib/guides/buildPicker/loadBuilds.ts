import { ensureItemsData, getItem, itemIconUrlFromPath } from "@/lib/datadragon/items";
import type { GuideItemSectionConfig } from "@/lib/guides/itemGuideTypes";
import { pickerBuildDefs, type PickerBuild, type PickerItem } from "./builds";

const PICKER_BOOT_IDS = [3008, 3009, 3047, 3111];

function resolvePickerItem(id: number): PickerItem {
  const row = getItem(String(id));
  return { id, name: row?.name ?? String(id), icon: itemIconUrlFromPath(row?.iconPath) };
}

/** Server-side: resolve item names and icons for every picker build. */
export async function loadPickerBuilds(config: GuideItemSectionConfig): Promise<PickerBuild[]> {
  await ensureItemsData();
  return pickerBuildDefs(config).map(({ itemIds, ...def }) => ({
    ...def,
    items: itemIds.map(resolvePickerItem),
  }));
}

/** Picker-only: these are inserted into the recommended card, never guide variants. */
export async function loadPickerBoots(): Promise<PickerItem[]> {
  await ensureItemsData();
  return PICKER_BOOT_IDS.map(resolvePickerItem);
}
