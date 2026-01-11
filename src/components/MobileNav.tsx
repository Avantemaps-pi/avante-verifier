import { Menu, FileText, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PiLoginButton } from "@/components/PiLoginButton";
import { PaymentHistory } from "@/components/PaymentHistory";
import { Badge } from "@/components/ui/badge";
import { usePaymentCount } from "@/hooks/usePaymentCount";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const { count, newCount, hasNotification, markAsViewed } = usePaymentCount();

  const handlePaymentHistoryOpen = () => {
    setOpen(false);
    setPaymentHistoryOpen(true);
    markAsViewed();
  };

  const handlePaymentHistoryChange = (isOpen: boolean) => {
    setPaymentHistoryOpen(isOpen);
    if (isOpen) {
      markAsViewed();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="sm:hidden relative">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
            {hasNotification && (
              <>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
              </>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6">
            <PiLoginButton />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Button 
              variant="outline" 
              className="w-full gap-2 justify-start relative"
              onClick={handlePaymentHistoryOpen}
            >
              <Receipt className="h-4 w-4" />
              Payment History
              {count > 0 && (
                <Badge 
                  variant={hasNotification ? "default" : "secondary"}
                  className={`ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-xs ${
                    hasNotification ? "animate-pulse bg-primary" : ""
                  }`}
                >
                  {newCount > 0 ? `${newCount > 99 ? '99+' : newCount} new` : count > 99 ? '99+' : count}
                </Badge>
              )}
            </Button>
            <Link to="/docs" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full gap-2 justify-start">
                <FileText className="h-4 w-4" />
                API Docs
              </Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      <Sheet open={paymentHistoryOpen} onOpenChange={handlePaymentHistoryChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payment History</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <PaymentHistory />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
