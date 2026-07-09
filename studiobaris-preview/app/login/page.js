import { getTeamLogin } from "../../lib/server-data";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const team = await getTeamLogin();
  return <LoginForm team={team} />;
}
