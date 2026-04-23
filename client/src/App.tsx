import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState, createContext, useContext } from "react";
import { getUser, setUser, type AuthUser } from "@/lib/auth";

import AuthPage from "@/pages/AuthPage";
import MatchesPage from "@/pages/MatchesPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import GroupsPage from "@/pages/GroupsPage";
import BracketPage from "@/pages/BracketPage";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

// Auth context
type AuthContextType = {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [user, setUserState] = useState<AuthUser | null>(getUser);

  const login = (u: AuthUser) => {
    setUser(u);
    setUserState(u);
  };
  const logout = () => {
    setUser(null);
    setUserState(null);
  };

  // If not logged in — always show AuthPage
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, login, logout }}>
          <AuthPage />
          <Toaster />
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={() => (
              <Layout>
                <MatchesPage />
              </Layout>
            )} />
            <Route path="/groups" component={() => (
              <Layout>
                <GroupsPage />
              </Layout>
            )} />
            <Route path="/bracket" component={() => (
              <Layout>
                <BracketPage />
              </Layout>
            )} />
            <Route path="/leaderboard" component={() => (
              <Layout>
                <LeaderboardPage />
              </Layout>
            )} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
