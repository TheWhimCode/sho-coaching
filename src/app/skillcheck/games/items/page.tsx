"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  ensureItemsData,
  getItemTree,
  type ItemTreeNode,
} from "@/lib/datadragon/items";

export default function ItemsTestPage() {
  const [tree, setTree] = useState<ItemTreeNode | null>(null);

  useEffect(() => {
    async function load() {
      await ensureItemsData();
      setTree(getItemTree("6653")); // Liandry's Torment
    }
    load();
  }, []);

  if (!tree) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center p-10">
      <LegendaryTree node={tree} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           LINE-DRAWING HELPERS                              */
/* -------------------------------------------------------------------------- */

function useBoundingBox(ref: React.RefObject<HTMLDivElement | null>) {
  const [box, setBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setBox({
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
    });
  }, [ref]);

  return box;
}

/* -------------------------------------------------------------------------- */
/*                                  ITEM ICON                                  */
/* -------------------------------------------------------------------------- */

function ItemIcon({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="w-16 h-16 rounded border border-gray-600 shadow-md bg-black/20"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                         ROOT: LEGENDARY + EPIC ROW                          */
/* -------------------------------------------------------------------------- */

function LegendaryTree({ node }: { node: ItemTreeNode }) {
  const epics = node.components;

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const box = useBoundingBox(nodeRef);

  const verticalGap = 64;

  return (
    <div className="flex flex-col items-center" style={{ width: "fit-content" }}>
      {/* Legendary item */}
      <div ref={nodeRef}>
        <ItemIcon src={node.icon} />
      </div>

      {/* Epic row */}
      {epics.length > 0 && (
        <div
          className="relative flex flex-col items-center"
          style={{ marginTop: verticalGap }}
        >
          {/* Vertical connector */}
          {box && (
            <div
              className="absolute bg-gray-600"
              style={{
                top: -verticalGap + 16,
                height: verticalGap - 16,
                width: 2,
              }}
            />
          )}

          {/* EPIC COLUMNS */}
          <div className="flex justify-center items-start">
            {epics.map((epic) => (
              <EpicColumn key={epic.id} node={epic} />
            ))}
          </div>

          {/* Horizontal line under legendary row */}
          <div
            className="absolute bg-gray-600"
            style={{
              top: -verticalGap + 16,
              height: 2,
              left: 0,
              right: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               EPIC COLUMN                                   */
/* -------------------------------------------------------------------------- */

function EpicColumn({ node }: { node: ItemTreeNode }) {
  const basics = node.components;
  const hasBasics = basics.length > 0;

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const box = useBoundingBox(nodeRef);

  const verticalGap = 56;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: 240 }} // fixed width to align columns
    >
      <div ref={nodeRef}>
        <ItemIcon src={node.icon} />
      </div>

      {/* Basics under this epic */}
      {hasBasics && (
        <div
          className="relative flex flex-col items-center"
          style={{ marginTop: verticalGap }}
        >
          {/* Vertical connector */}
          {box && (
            <div
              className="absolute bg-gray-600"
              style={{
                top: -verticalGap + 16,
                height: verticalGap - 16,
                width: 2,
              }}
            />
          )}

          {/* Basic items */}
          <div
            className="flex justify-center items-start"
            style={{ columnGap: 40 }}
          >
            {basics.map((basic) => (
              <BasicNode key={basic.id} node={basic} />
            ))}
          </div>

          {/* Horizontal bar under basics */}
          <div
            className="absolute bg-gray-600"
            style={{
              top: -verticalGap + 16,
              height: 2,
              left: 0,
              right: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               BASIC NODE                                    */
/* -------------------------------------------------------------------------- */

function BasicNode({ node }: { node: ItemTreeNode }) {
  return (
    <div className="relative flex flex-col items-center">
      <ItemIcon src={node.icon} />
    </div>
  );
}
