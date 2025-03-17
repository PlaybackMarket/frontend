"use client";

import { CollectionsTable } from "@/components/CollectionsTable";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <CollectionsTable />
      </div>
    </div>
  );
}
