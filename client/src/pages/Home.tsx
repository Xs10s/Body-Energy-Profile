import { useState } from "react";
import { useLocation } from "wouter";
import { InputForm } from "@/components/InputForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ProfileInput } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    try {
      localStorage.setItem("profileInput", JSON.stringify(data));
      setLocation("/result");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Body Energy Profile</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="py-8 md:py-12 px-4">
        <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

        <footer className="max-w-2xl mx-auto mt-8 text-center text-xs text-muted-foreground">
          <p>
            Dit is geen medische diagnose. Raadpleeg een professional voor gezondheidsadvies.
          </p>
        </footer>
      </main>
    </div>
  );
}
