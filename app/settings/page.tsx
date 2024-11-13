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
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: "Please enter a valid phone number",
  }),
  alerts_enabled: z.boolean(),
  alert_types: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You must select at least one alert type.",
  }),
})

type FormValues = z.infer<typeof formSchema>

const SettingsPage = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      notifications: true,
      phone_number: "",
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
            phone_number: data.phone_number || '',
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
          phone_number: values.phone_number,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 container py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

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
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your phone number for receiving alerts (include country code)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alerts_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Phone Alerts
                        </FormLabel>
                        <FormDescription>
                          Receive trading alerts on your phone
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

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default SettingsPage