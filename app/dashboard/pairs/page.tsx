import AddPairDialog from "@/components/AddPairDialog"
import PairsTable from "@/components/PairsTable"
import { Button } from "@/components/ui/button"

export default function TradingPairsPage() {
  return (
    <div className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Trading Pairs</h1>
          <AddPairDialog />
        </div>
        <PairsTable />
      </div>
    </div>
  )
}
