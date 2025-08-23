"use client";

import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";

// Dynamic imports with no SSR to avoid window reference issues
const AddPairDialog = dynamic(() => import("@/components/AddPairDialog"), { ssr: false });
const PairsTable = dynamic(() => import("@/components/PairsTable"), { ssr: false });
const NotificationPermission = dynamic(() => import("@/components/NotificationPermission"), { ssr: false });

export default function SignalsPage() {
  const handlePairAdded = (pair: any) => {
    // The PairsTable component will handle the pair addition internally
    console.log("Pair added:", pair);
  };

  return (
    <div className="h-full w-full">
      <div className="p-2 sm:p-6 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Trading Pairs
          </h1>
          <div className="w-full sm:w-auto">
            <AddPairDialog onPairAdded={handlePairAdded} />
          </div>
        </div>

        <NotificationPermission className="mb-6" />

        <PairsTable />
      </div>
    </div>
  );
}
