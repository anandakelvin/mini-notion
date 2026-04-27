import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { authMiddleware } from "~/middlewares/auth.middleware";

export const clientLoader = async (args: any) => {
  return authMiddleware(args);
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
