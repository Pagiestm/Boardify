"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { Sidebar } from "./sidebar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

export const MobileSidebar = () => {
  const pathname = usePathname();
  // Remember which path the sheet was opened on so it closes after navigation.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={(open) => setOpenPath(open ? pathname : null)}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Ouvrir le menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
