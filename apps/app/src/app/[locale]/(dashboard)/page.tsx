import { getI18n } from "@/locales/server"
import { getUser } from "@v1/supabase/queries"
import { DashboardClient } from './client'

export const metadata = {
  title: "Deep Work",
  description: "Plan your focused time"
}

export default async function Page() {
  const { data } = await getUser()
  const t = await getI18n()

  return <DashboardClient user={data?.user} />
}
