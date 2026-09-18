import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionData = await getSession();

  if (!sessionData) {
    redirect("/login");
  }

  const { store, user } = sessionData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Header
        storeName={store.name}
        storeCode={store.code || undefined}
        userName={`${user.firstName} ${user.lastName}`.trim()}
      />
      <main className="flex-1 max-w-3xl w-full mx-auto p-3.5 sm:p-5 pb-10">
        {children}
      </main>
    </div>
  );
}
