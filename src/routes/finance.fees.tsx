import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/finance/fees')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/finance/fees"!</div>
}
