"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { PromptSuggestion } from "@/components/ui/prompt-suggestion"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface TaskResponse {
  id: string
  status: string
  task?: string
  message?: string
  output?: string
  error?: string
  started_at?: string
  completed_at?: string
  urls_visited?: string[]
  actions?: string[]
  steps?: number
}

interface TaskStatus {
  id: string
  status: string
  task?: string
  started_at?: string
  completed_at?: string
  output?: string
  error?: string
  urls_visited?: string[]
  actions?: string[]
  steps?: number
}

interface PromptInputComponentProps {
  onSubmit?: (content: string) => void
  placeholder?: string
  showSuggestions?: boolean
  className?: string
  tooltip?: string
}

export function PromptInputComponent({
  onSubmit,
  placeholder = "Describe what you want the browser to do...",
  showSuggestions = true,
  className = "w-full max-w-(--breakpoint-md)",
  tooltip = "Start Chat"
}: PromptInputComponentProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTask, setCurrentTask] = useState<TaskResponse | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [output, setOutput] = useState<string>("")
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const { user } = useAuth()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const runTask = async (taskDescription: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: taskDescription,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const taskResponse: TaskResponse = await response.json()
      setCurrentTask(taskResponse)
      return taskResponse
    } catch (error) {
      console.error("Error running task:", error)
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null // Task not found
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const status: TaskStatus = await response.json()
      setTaskStatus(status)
      return status
    } catch (error) {
      console.error("Error checking task status:", error)
      return null
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    const status = await checkTaskStatus(taskId)
    if (status && ["finished", "failed", "stopped"].includes(status.status)) {
      // Task completed, update output
      const resultText = status.output || status.error || "Task completed"
      setOutput(resultText)
      setCurrentTask(status)
      setIsLoading(false)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || !user) return

    // Clear input immediately
    const currentInput = input.trim()
    setInput("")
    setIsLoading(true)
    setOutput("Starting task...")
    setCurrentTask(null)
    setTaskStatus(null)

    try {
      // Create the task first
      const taskResponse = await runTask(currentInput)

      if (taskResponse && taskResponse.id) {
        const newTaskId = taskResponse.id

        // Create a chat with initial messages
        const initialMessages = [{
          id: `user-${Date.now()}`,
          role: 'user',
          content: currentInput,
          timestamp: new Date().toISOString()
          // user messages don't need a type field
        }]

        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            task_id: newTaskId,
            title: `Task: ${currentInput.slice(0, 50)}${currentInput.length > 50 ? '...' : ''}`,
            messages: initialMessages
          })
          .select()
          .single()

        if (chatError) {
          console.error('Error creating chat:', chatError)
          setOutput(`Error creating chat: ${chatError.message}`)
          setIsLoading(false)
          return
        }

        // Navigate to the chat page
        router.push(`/chat/${chatData.id}`)
        return
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  const handleValueChange = (value: string) => {
    setInput(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished": return "text-green-600"
      case "failed": return "text-red-600"
      case "running": return "text-blue-600"
      case "paused": return "text-yellow-600"
      default: return "text-gray-600"
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          <PromptSuggestion onClick={() => setInput("Search for the latest news about AI")}>
            Search for the latest news about AI
          </PromptSuggestion>
          <PromptSuggestion onClick={() => setInput("Take a screenshot of the current page")}>
            Take a screenshot of the current page
          </PromptSuggestion>
          <PromptSuggestion onClick={() => setInput("Fill out a contact form with test data")}>
            Fill out a contact form with test data
          </PromptSuggestion>
        </div>
      )}

      <PromptInput
        value={input}
        onValueChange={handleValueChange}
        isLoading={isLoading}
        onSubmit={() => {
          if (onSubmit) {
            onSubmit(input.trim())
            setInput("") // Clear input immediately when using onSubmit prop
          } else {
            handleSubmit()
          }
        }}
        className="w-full"
      >
        <PromptInputTextarea placeholder={placeholder} />
        <PromptInputActions className="justify-end pt-2">
          <PromptInputAction tooltip={tooltip}>
            <Button
              variant="default"
              size="icon"
              className={cn("h-8 w-8 rounded-full", (isLoading || !input.trim() && "disabled:opacity-30 bg-black text-white"))}
              onClick={() => {
                if (onSubmit) {
                  onSubmit(input.trim())
                  setInput("") // Clear input immediately when using onSubmit prop
                } else {
                  handleSubmit()
                }
              }}
              disabled={isLoading || !input.trim()}
            >
              <ArrowUp className="size-5" strokeWidth={3.25}/>
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  )
}

// Legacy component for backward compatibility
export function PromptInputBasic() {
  return <PromptInputComponent />
}
