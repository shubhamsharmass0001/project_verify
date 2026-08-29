import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, Menu, X, Send, User, LayoutDashboard, ShieldCheck, Sun, Moon, Trophy, Sparkles, ChevronDown, GraduationCap, Shield } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, profile, isAdmin, isHeadAdmin, isDemo, demoRole, loginAsDemo, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDemoLogin = (role: "student" | "admin") => {
    loginAsDemo(role);
    setMobileOpen(false);
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/submit");
    }
  };

  const links = user ?
    [
      ...(isAdmin && !isHeadAdmin ? [] : [
        { to: "/submit", label: "Submit", icon: Send },
        { to: "/my-submissions", label: "My Submissions", icon: LayoutDashboard }]),

      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/profile", label: "Profile", icon: User },
      ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : [])] :
    [];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background text-xs font-black">V</div>
          <span className="font-semibold text-sm tracking-tight">VerifyHub</span>
          {isDemo && (
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
              Demo ({demoRole})
            </Badge>
          )}
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          {links.map((l) =>
            <Button key={l.to} variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-[13px]">
              <Link to={l.to} className="gap-1.5">
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          {isDemo && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-[12px] font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>{demoRole === "admin" ? "Demo Admin" : "Demo Student"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Interview Demo Mode</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleDemoLogin("student")} className="gap-2 cursor-pointer text-xs">
                  <GraduationCap className="h-3.5 w-3.5" /> Switch to Demo Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDemoLogin("admin")} className="gap-2 cursor-pointer text-xs">
                  <Shield className="h-3.5 w-3.5" /> Switch to Demo Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-xs text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Exit Demo Mode
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!user && (
            <>
              {/* Sample / Demo Bypass Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-[13px] font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>Sample Demo</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">1-Click Bypass (Interview Mode)</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDemoLogin("student")} className="gap-2 cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">Demo Student</span>
                      <span className="text-[10px] text-muted-foreground">Test submission & profile</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDemoLogin("admin")} className="gap-2 cursor-pointer">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">Demo Admin</span>
                      <span className="text-[10px] text-muted-foreground">Test admin dashboard & stats</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" asChild className="h-8 px-4 text-[13px] rounded-md">
                <Link to="/auth">Sign In</Link>
              </Button>
            </>
          )}

          {user && !isDemo && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2.5 text-muted-foreground hover:text-destructive text-[13px]">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t pb-3">
          <div className="container flex flex-col gap-1 pt-2">
            {links.map((l) =>
              <Button key={l.to} variant="ghost" size="sm" asChild className="justify-start text-muted-foreground hover:text-foreground h-8 text-[13px]" onClick={() => setMobileOpen(false)}>
                <Link to={l.to} className="gap-2">
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              </Button>
            )}

            {!user && (
              <div className="flex flex-col gap-2 pt-2 border-t mt-1">
                <div className="text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                  Interview Quick Access
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[12px] gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    onClick={() => handleDemoLogin("student")}
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Demo Student
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[12px] gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    onClick={() => handleDemoLogin("admin")}
                  >
                    <Shield className="h-3.5 w-3.5" /> Demo Admin
                  </Button>
                </div>
                <Button size="sm" asChild className="h-8 text-[13px] w-full mt-1">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
                </Button>
              </div>
            )}

            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start text-destructive h-8 text-[13px] gap-2">
                <LogOut className="h-3.5 w-3.5" />
                {isDemo ? "Exit Demo Mode" : "Sign Out"}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}