"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProcenaHistoryTable from "../components/ProcenaHistoryTable";
import { btn, pageContainer, PageHeader } from "../components/ui";

export default function ProcenaHistoryPage() {
    return (
        <div className={pageContainer}>
            <PageHeader
                title="Процене ризика"
                description="Све процене са статусом и бројем идентификованих ризика."
                actions={
                    <Link href="/optimized-risk" className={btn.primary}>
                        <Plus className="h-4 w-4" />
                        Нова процена
                    </Link>
                }
            />
            <ProcenaHistoryTable />
        </div>
    );
}
