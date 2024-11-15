"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell } from "lucide-react"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from 'next/navigation'
import { LogOut } from "lucide-react"

const alertTypes = [
  {
    id: "extreme_signals",
    label: "Extreme Signals",
    description: "Get notified when indicators show extreme buy/sell signals",
  },
  {
    id: "price_alerts",
    label: "Price Alerts",
    description: "Receive alerts for significant price movements",
  },
  {
    id: "divergence",
    label: "Divergence Alerts",
    description: "Get notified of bullish/bearish divergences",
  },
] as const

const formSchema = z.object({
  email: z.string().email(),
  notifications: z.boolean(),
  alerts_enabled: z.boolean(),
  alert_types: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You must select at least one alert type.",
  }),
})

type FormValues = z.infer<typeof formSchema>

const NOTIFICATION_SETTINGS_KEY = 'pairNotificationSettings'

interface NotificationSettings {
  [symbol: string]: boolean;
}

const SettingsPage = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({})
  const [pairs, setPairs] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      notifications: true,
      alerts_enabled: false,
      alert_types: ["extreme_signals"],
    },
  })

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/alerts')
        const data = await response.json()
        
        if (data && !data.error) {
          form.reset({
            ...form.getValues(),
            alerts_enabled: data.enabled || false,
            alert_types: data.alert_types || ['extreme_signals'],
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [form])

  // Add new useEffect for notification settings
  useEffect(() => {
    // Load notification settings from localStorage
    const savedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings))
    }

    // Check if notifications are enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }

    // Fetch pairs from Supabase
    const fetchPairs = async () => {
      const { data: pairsData } = await supabase
        .from('pairs')
        .select('symbol')
      
      if (pairsData) {
        setPairs(pairsData.map(p => p.symbol))
      }
    }

    fetchPairs()
  }, [])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const handleToggleNotification = (symbol: string) => {
    const newSettings = {
      ...notificationSettings,
      [symbol]: !notificationSettings[symbol]
    }
    setNotificationSettings(newSettings)
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings))
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true)
      
      // Update alert settings
      const alertResponse = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_types: values.alert_types,
          enabled: values.alerts_enabled,
        }),
      })

      if (!alertResponse.ok) throw new Error('Failed to update alert settings')

      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you want to receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="alerts_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Alerts
                        </FormLabel>
                        <FormDescription>
                          Receive trading alerts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alert_types"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Alert Types</FormLabel>
                        <FormDescription>
                          Select which types of alerts you want to receive
                        </FormDescription>
                      </div>
                      {alertTypes.map((type) => (
                        <FormField
                          key={type.id}
                          control={form.control}
                          name="alert_types"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type.id)}
                                    onCheckedChange={(checked: boolean) => {
                                      return checked
                                        ? field.onChange([...field.value, type.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== type.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    {type.label}
                                  </FormLabel>
                                  <FormDescription>
                                    {type.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Browser Push Notifications
                </CardTitle>
                <CardDescription>
                  Configure which trading pairs you want to receive browser notifications for.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!notificationsEnabled && (
                  <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg">
                    <p className="text-yellow-500 text-sm">
                      Browser notifications are not enabled. 
                      <button 
                        onClick={requestNotificationPermission}
                        className="ml-2 underline hover:text-yellow-400"
                      >
                        Enable Notifications
                      </button>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {pairs.map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between">
                      <Label htmlFor={`notify-${symbol}`} className="flex items-center gap-2">
                        {symbol}
                      </Label>
                      <Switch
                        id={`notify-${symbol}`}
                        checked={notificationSettings[symbol] || false}
                        onCheckedChange={() => handleToggleNotification(symbol)}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Form>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
export default SettingsPage
