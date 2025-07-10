import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function MobileOnlyPage() {
  const githubRepoUrl = "https://github.com/airoflare/tasklytics"; 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Desktop Only</h1>
      <p className="text-md mb-8 max-w-md">
        This application is designed for desktop use only. Please access it from a desktop browser for the best experience.
      </p>
      <Button asChild>
        <a href={githubRepoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          View on GitHub
        </a>
      </Button>
    </div>
  );
}