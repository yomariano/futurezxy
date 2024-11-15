'use client'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, BarChart2, TrendingUp, AlertCircle, Zap, Lock, CheckCircle2, LineChart, Smartphone, BookOpen, Unlock, Crown, User } from 'lucide-react'
import AuthButton from '@/components/AuthButton'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Component() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/signals')
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      
      if (error) {
        console.error('Authentication error:', error.message)
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link className="flex items-center space-x-2" href="/">
              <TrendingUp className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">FutureSignals</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#features">
                Features
              </Link>
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#pricing">
                Pricing
              </Link>
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="#testimonials">
                Testimonials
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Maximize Your Futures Trading Potential
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Get precise entry and exit signals for futures trading. Boost your profits with our advanced AI-powered platform.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleGetStarted}>
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Powerful Features</h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <BarChart2 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Get in-depth market analysis and trend predictions to make informed trading decisions.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <AlertCircle className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Real-time Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Receive instant notifications for optimal entry and exit points in your trades.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>AI-Powered Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Leverage machine learning algorithms for highly accurate trading signals.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <LineChart className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multi-Timeframe Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Analyze markets across multiple timeframes for comprehensive trading strategies.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Smartphone className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Mobile Compatibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Access your trading signals and analytics on-the-go with our mobile-friendly platform.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Educational Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Enhance your trading skills with our comprehensive library of tutorials and guides.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Choose Your Plan</h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
                    <Unlock className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Free Tier</CardTitle>
                  <CardDescription>For beginners</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">$0</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Scan 2 tokens</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Basic analytics</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Daily signals</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Pro Tier</CardTitle>
                  <CardDescription>For serious traders</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">$49</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Scan 10 tokens</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Advanced analytics</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Real-time signals</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Email alerts</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Upgrade to Pro</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
                    <Crown className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Elite Tier</CardTitle>
                  <CardDescription>For professional traders</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">$99</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per month</p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Unlimited token scanning</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> AI-powered predictions</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Custom alerts</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> Priority support</li>
                    <li className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" /> API access</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Go Elite</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">What Our Traders Say</h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardContent className="mt-4">
                  <div className="flex justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">"FutureSignals has completely transformed my trading strategy. The accuracy of their signals is unmatched!"</p>
                  <p className="mt-2 font-bold">- Sarah T., Professional Trader</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="mt-4">
                  <div className="flex justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">"The real-time alerts have saved me countless times from potential losses. It's like having a pro trader by your side 24/7."</p>
                  <p className="mt-2 font-bold">- Mike R., Day Trader</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="mt-4">
                  <div className="flex justify-center mb-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">"I started with the free tier and quickly upgraded to Elite. The ROI speaks for itself. Best investment for my trading career!"</p>
                  <p className="mt-2 font-bold">- Alex K., Crypto Enthusiast</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2023 FutureSignals. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}