import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/todo/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/todo/new"!</div>
}
