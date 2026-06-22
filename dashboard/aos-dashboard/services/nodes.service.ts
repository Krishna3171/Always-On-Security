import { api } from "@/lib/axios";

export async function getNodes() {
  const { data } = await api.get("/nodes/security");
  return data;
}
