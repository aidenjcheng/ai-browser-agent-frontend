"use client"

import { ChatHistory } from "@/components/chat/chat-history";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { useChatHistory } from "@/lib/use-chat-history";
import { LogOut } from "lucide-react";
import { PromptInputBasic } from "@/components/prompt-input";

function HomeContent() {
  const { user, signOut } = useAuth();
  const { hasChats } = useChatHistory();

  const getUserInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex max-h-screen w-full bg-sidebar">
        {hasChats && <AppSidebar />}
        <main className={`${hasChats ? 'flex-1' : 'w-full'} flex flex-col border-l mt-1 border-t rounded-xl bg-background h-fit min-h-screen`}>
          {/* Header */}
          <header className="flex items-center justify-between pl-2 pt-2 pb-4 pr-4">
            <div className="flex items-center space-x-3">
              {hasChats && <SidebarTrigger />}

            </div>

            <div className="flex items-center space-x-4">
              <Avatar className="size-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
                <AvatarFallback className="text-xs">
                  {user?.email ? getUserInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex pt-20 justify-center px-8">
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-left space-y-4">
                <h2 className="text-3xl font-bold">L2 AI</h2>
                <p className="text-lg text-muted-foreground">
                  Describe what you want the browser to do and I'll help you automate it.
                </p>
              </div>

              <PromptInputBasic />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent className=" mx-2 mt-5">
        <ChatHistory showHeader={false} />
      </SidebarContent>
    </Sidebar>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

