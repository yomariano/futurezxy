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
import { StripeCheckout } from "@/components/ui/stripe-checkout"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

const BillingPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | null>(null)
  const { toast } = useToast()

  const handleSubscribe = (plan: 'basic' | 'pro') => {
    setSelectedPlan(plan)
  }

  return (
    <div className="p-6 sm:p-10 container py-10">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Plan</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">$9.99/month</div>
            <ul className="space-y-2">
              <li>• Basic trading signals</li>
              <li>• 5 trading pairs</li>
              <li>• Basic analytics</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSubscribe('basic')}
              disabled={isLoading}
              className="w-full"
            >
              Subscribe to Basic
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>For serious traders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">$29.99/month</div>
            <ul className="space-y-2">
              <li>• Advanced trading signals</li>
              <li>• Unlimited trading pairs</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSubscribe('pro')}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              Subscribe to Pro
            </Button>
          </CardFooter>
        </Card>
      </div>

      <StripeCheckout 
        isOpen={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan!}
      />
    </div>
  )
}

export default BillingPage