import { Button } from "@/components/ui/button";
import { usePiAuth, isPiBrowser } from "@/contexts/PiAuthContext";
import { Loader2, LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PiLoginButton = () => {
  const { user, isLoading, isSDKReady, login, logout } = usePiAuth();

  // Not in Pi Browser
  if (!isPiBrowser() && !isSDKReady) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 opacity-50">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Pi Browser Required</span>
      </Button>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Authenticating...</span>
      </Button>
    );
  }

  // Logged in state
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Logged out state
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={login} 
      className="gap-2"
      disabled={!isSDKReady}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Login with Pi</span>
    </Button>
  );
};
