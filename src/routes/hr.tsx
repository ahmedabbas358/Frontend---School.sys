import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/hr")({ component: () => <Outlet /> });
