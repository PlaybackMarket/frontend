"use client";

import { LendDashboard } from "@/components/LendDashboard";
import { CollectionReader } from "@/components/CollectionReader";
import { NFTReader } from "@/components/NFTReader";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-cyan-500">
      <LendDashboard />
      <CollectionReader collectionAddress="6516ETJzXYgRjuy9V6UFszdghSfPa578jw2przR2H8ob" />
      <NFTReader nftAddress="JDRdi4wuUR9qQ9G9iuPtbzqZfQs3jkFtzQaCg5DwR87N" />
    </div>
  );
}
