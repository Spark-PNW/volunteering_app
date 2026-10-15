"use client";

import { useId, useState } from "react";

import { StaffEventGrid } from "@/features/staff-experience/staff-event-grid";
import type { Opportunity } from "@/lib/opportunities";

type StaffEventTabsProps = {
  available: Opportunity[];
  past: Opportunity[];
  isLoading: boolean;
  isNotesMode: boolean;
};

export function StaffEventTabs({
  available,
  past,
  isLoading,
  isNotesMode,
}: StaffEventTabsProps) {
  const [activeTab, setActiveTab] = useState("available");
  const id = useId();
  const tabs = [
    { key: "available", label: "Available Events", events: available, empty: "No available events right now." },
    { key: "past", label: "Past Events", events: past, empty: "No past events yet." },
  ];

  return (
    <div>
      <div aria-label="Staff events" className="flex overflow-x-auto border-b border-zinc-200" role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${id}-${tab.key}-panel`}
            aria-selected={activeTab === tab.key}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${activeTab === tab.key ? "border-blue-700 text-blue-700" : "border-transparent text-zinc-600 hover:text-zinc-900"}`}
            id={`${id}-${tab.key}-tab`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            onKeyDown={(event) => {
              let nextIndex: number;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
              } else if (event.key === "Home") {
                nextIndex = 0;
              } else if (event.key === "End") {
                nextIndex = tabs.length - 1;
              } else {
                return;
              }
              event.preventDefault();
              setActiveTab(tabs[nextIndex].key);
              document.getElementById(`${id}-${tabs[nextIndex].key}-tab`)?.focus();
            }}
            role="tab"
            tabIndex={activeTab === tab.key ? 0 : -1}
            type="button"
          >
            {tab.label}{isLoading ? "" : ` (${tab.events.length})`}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`${id}-${tab.key}-tab`}
          className="mt-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          hidden={activeTab !== tab.key}
          id={`${id}-${tab.key}-panel`}
          key={tab.key}
          role="tabpanel"
          tabIndex={0}
        >
          {!isLoading && (tab.events.length > 0 ? (
            <StaffEventGrid isNotesMode={isNotesMode} opportunities={tab.events} />
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
              {tab.empty}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
