import AddPairDialog from "@/components/AddPairDialog";
import PairsTable from "@/components/PairsTable";
import NotificationPermission from "@/components/NotificationPermission";
import { Button } from "@/components/ui/button";

export default function SignalsPage() {
  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className="p-2 sm:p-6 space-y-6 min-w-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            Trading Pairs
          </h1>
          {/* <AddPairDialog /> */}
        </div>

        <NotificationPermission className="mb-6" />

        <PairsTable />
      </div>
    </div>
  );
}
