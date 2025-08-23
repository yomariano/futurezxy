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
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Check, AlertCircle } from "lucide-react"
import { useState } from "react"

interface AddPairDialogProps {
  onPairAdded?: (pair: any) => void;
}

export default function AddPairDialog({ onPairAdded }: AddPairDialogProps) {
  const [open, setOpen] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [exchange] = useState("mexc") // Fixed to MEXC only
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!symbol.trim()) {
      setError("Please enter a trading pair symbol")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.trim(),
          exchange,
          enabled: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Pair added successfully!')
        setSymbol("")
        onPairAdded?.(data.pair)
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('pairAdded', { 
          detail: data.pair 
        }));
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
        }, 1500)
      } else {
        setError(data.error || 'Failed to add pair')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error adding pair:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setSymbol("")
        setError(null)
        setSuccess(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Add Trading Pair
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-lg sm:text-xl">Add New Trading Pair</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Add a new trading pair to MEXC exchange
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label htmlFor="symbol" className="text-sm font-medium">
              Trading Pair Symbol
            </Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., BTCUSDT, ETHUSDT"
              required
              disabled={loading}
              className="h-12 text-base sm:text-sm"
            />
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Enter symbol without separators (e.g., BTCUSDT not BTC/USDT)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                🏢 Exchange: MEXC
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white mt-6" 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {loading ? "Adding Pair..." : "Add Pair to MEXC"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
