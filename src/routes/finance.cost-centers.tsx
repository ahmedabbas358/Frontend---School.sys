import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/finance/cost-centers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/finance/cost-centers"!</div>
}
