import { PromptInputBasic } from "@/components/prompt-input";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Manus AI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Browser Automation Powered by Browser-Use Cloud
        </p>
        <p className="text-sm text-gray-500">
          Describe what you want the browser to do, and watch it happen in real-time
        </p>
      </div>

      {/* Main Interface */}
      <div className="flex items-center justify-center">
        <PromptInputBasic />
      </div>
      {/* Footer */}
      <div className="text-center mt-12 text-sm text-gray-500">
        <p>Powered by <a href="https://docs.browser-use.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Browser-Use Cloud API</a></p>
      </div>
    </div>
  );
}
