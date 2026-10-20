import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentForm } from "@/features/agents/components/agent-form";
import { Link } from "@/i18n/navigation";

export default function AddAgentPage() {
  return (
    <main className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex items-center gap-3">
          <Button
            asChild
            className="size-10 rounded-xl border-[#d7e2ef] bg-white text-[#31486b] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
            size="icon"
            variant="outline"
          >
            <Link aria-label="Agentlərə qayıt" href="/agents">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#102442]">
              Yeni agent
            </h1>
            <p className="mt-0.5 text-sm text-[#637392]">
              Profil, əlaqələr və portal girişini bir yerdə yaradın.
            </p>
          </div>
        </header>

        <AgentForm />
      </div>
    </main>
  );
}
