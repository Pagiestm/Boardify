"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onopenchange: (open: boolean) => void;
  title?: string;
}

export const ResponsiveModal = ({
  children,
  open,
  onopenchange,
  title = "Fenêtre",
}: ResponsiveModalProps) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onopenchange}>
        <DialogContent
          aria-describedby={undefined}
          className="hide-scrollbar block max-h-[88vh] w-full overflow-y-auto p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onopenchange}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <div className="hide-scrollbar max-h-[85vh] overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
};
