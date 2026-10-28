import { QuickAdd } from "@/features/desktop/components/quick-add";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Nouvelle tâche");

const QuickAddPage = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background p-4">
      <QuickAdd />
    </div>
  );
};

export default QuickAddPage;
