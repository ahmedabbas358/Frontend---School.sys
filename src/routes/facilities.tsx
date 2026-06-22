import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/facilities")({
  component: FacilitiesLayout,
});

function FacilitiesLayout() {
  return <Outlet />;
}
