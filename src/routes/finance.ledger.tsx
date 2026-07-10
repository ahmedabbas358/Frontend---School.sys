import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/finance/ledger')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/finance/ledger"!</div>
}
