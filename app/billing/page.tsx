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
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { useState } from "react"

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  name: string
  price: string
  description: string
  features: PlanFeature[]
  recommended?: boolean
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Basic trading signals and analysis",
    features: [
      { name: "Basic trading signals", included: true },
      { name: "Limited timeframes", included: true },
      { name: "Basic indicators", included: true },
      { name: "Community support", included: true },
      { name: "Advanced signals", included: false },
      { name: "Custom alerts", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$29",
    description: "Advanced features for serious traders",
    recommended: true,
    features: [
      { name: "Basic trading signals", included: true },
      { name: "All timeframes", included: true },
      { name: "Advanced indicators", included: true },
      { name: "Priority support", included: true },
      { name: "Advanced signals", included: true },
      { name: "Custom alerts", included: true },
    ],
  },
]

export default function BillingPage() {
  const [currentPlan] = useState("Free")

  const handleUpgrade = async (planName: string) => {
    // Implement your upgrade logic here
    console.log(`Upgrading to ${planName}`)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.recommended ? "border-primary" : ""
            }`}
          >
            {plan.recommended && (
              <Badge
                className="absolute top-4 right-4"
                variant="secondary"
              >
                Recommended
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle
                      className={`w-5 h-5 ${
                        feature.included
                          ? "text-green-500"
                          : "text-gray-300"
                      }`}
                    />
                    <span
                      className={
                        feature.included
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.name === currentPlan ? "secondary" : "default"}
                disabled={plan.name === currentPlan}
                onClick={() => handleUpgrade(plan.name)}
              >
                {plan.name === currentPlan
                  ? "Current Plan"
                  : "Upgrade"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 