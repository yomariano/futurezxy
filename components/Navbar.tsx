import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
