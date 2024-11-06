"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useState } from "react"

export default function AddPairDialog() {
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle pair addition logic here
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Trading Pair
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Trading Pair</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pair" className="text-sm font-medium">
              Trading Pair
            </label>
            <Input
              id="pair"
              placeholder="Enter trading pair (e.g., BTC/USDT)"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Add Pair
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
