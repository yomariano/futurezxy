"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState } from "react"

// Mock data - replace with real data
const mockData = [
  { date: '2024-01', signals: 65, accuracy: 78 },
  { date: '2024-02', signals: 72, accuracy: 82 },
  { date: '2024-03', signals: 58, accuracy: 75 },
  { date: '2024-04', signals: 80, accuracy: 85 },
]

const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('1M')

  return (
    <div className="p-6 sm:p-10 container py-10">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Signals</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">275</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal Accuracy</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">82%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Pairs</CardTitle>
            <CardDescription>Currently monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Signal Performance</CardTitle>
          <CardDescription>Historical signal accuracy and volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="signals" 
                  stroke="hsl(var(--chart-1))" 
                  name="Signals"
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--chart-2))" 
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPage 