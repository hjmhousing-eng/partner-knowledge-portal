import { redirect } from "next/navigation";

export default function AskPage() {
  redirect("/?ask=1");
}
