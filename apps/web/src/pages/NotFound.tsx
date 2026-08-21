import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-7xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
      </div>
      <Button render={<Link to="/" />}>Back to psh</Button>
    </main>
  )
}
