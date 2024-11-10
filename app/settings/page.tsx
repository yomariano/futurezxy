"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: false,
    autoConnect: false,
    defaultTimeframes: "1m,5m,15m,1h,4h",
    wsEndpoint: "ws://localhost:8080",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('tradingSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('tradingSettings', JSON.stringify(settings))
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure your trading interface preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for important trading signals
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Connect</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically connect to WebSocket on page load
                </p>
              </div>
              <Switch
                checked={settings.autoConnect}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConnect: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Default Timeframes</Label>
              <Input
                value={settings.defaultTimeframes}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTimeframes: e.target.value })
                }
                placeholder="1m,5m,15m,1h,4h"
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated list of timeframes to display
              </p>
            </div>

            <div className="space-y-2">
              <Label>WebSocket Endpoint</Label>
              <Input
                value={settings.wsEndpoint}
                onChange={(e) =>
                  setSettings({ ...settings, wsEndpoint: e.target.value })
                }
                placeholder="ws://localhost:8080"
              />
              <p className="text-sm text-muted-foreground">
                Connection endpoint for trading signals
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 