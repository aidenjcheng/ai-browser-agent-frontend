"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square, Play, Pause, StopCircle } from "lucide-react"
import { useState, useRef } from "react"

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

export function PromptInputBasic() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTask, setCurrentTask] = useState<TaskResponse | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [output, setOutput] = useState<string>("")
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
          metadata: { source: "manus-ai-frontend" }
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
    if (!input.trim()) return

    setIsLoading(true)
    setOutput("Starting task...")
    setCurrentTask(null)
    setTaskStatus(null)

    const taskResponse = await runTask(input.trim())

    if (taskResponse && taskResponse.id) {
      // Start polling for status updates immediately since task is queued
      pollingIntervalRef.current = setInterval(() => {
        pollTaskStatus(taskResponse.id)
      }, 2000) // Poll every 2 seconds

      // Initial status check
      await pollTaskStatus(taskResponse.id)
    } else {
      setIsLoading(false)
    }

    setInput("")
  }

  const handleStop = () => {
    if (currentTask?.id && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsLoading(false)
    setOutput("Task stopped by user")
  }

  const handlePause = async () => {
    if (currentTask?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/tasks/${currentTask.id}/pause`, {
          method: "PUT",
        })
        setOutput("Task paused")
      } catch (error) {
        console.error("Error pausing task:", error)
      }
    }
  }

  const handleResume = async () => {
    if (currentTask?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/tasks/${currentTask.id}/resume`, {
          method: "PUT",
        })
        setOutput("Task resumed")
        // Resume polling
        pollingIntervalRef.current = setInterval(() => {
          pollTaskStatus(currentTask.id)
        }, 2000)
      } catch (error) {
        console.error("Error resuming task:", error)
      }
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
    <div className="w-full max-w-(--breakpoint-md) space-y-4">
      <PromptInput
        value={input}
        onValueChange={handleValueChange}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className="w-full"
      >
        <PromptInputTextarea placeholder="Describe what you want the browser to do..." />
        <PromptInputActions className="justify-end pt-2">
          <PromptInputAction tooltip="Run Task">
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
            >
              <Play className="size-5" />
            </Button>
          </PromptInputAction>
          {isLoading && currentTask && (
            <>
              <PromptInputAction tooltip="Pause Task">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handlePause}
                >
                  <Pause className="size-5" />
                </Button>
              </PromptInputAction>
              <PromptInputAction tooltip="Resume Task">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleResume}
                >
                  <Play className="size-5" />
                </Button>
              </PromptInputAction>
              <PromptInputAction tooltip="Stop Task">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleStop}
                >
                  <StopCircle className="size-5" />
                </Button>
              </PromptInputAction>
            </>
          )}
        </PromptInputActions>
      </PromptInput>

      {/* Status and Output Display */}
      {taskStatus && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-sm font-medium ${getStatusColor(taskStatus.status)}`}>
              {taskStatus.status}
            </span>
          </div>
          {currentTask?.id && (
            <div className="text-xs text-gray-500">
              Task ID: {currentTask.id}
            </div>
          )}
        </div>
      )}

      {output && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Output:</div>
          <div className="text-sm whitespace-pre-wrap mb-4">{output}</div>

          {taskStatus && taskStatus.urls_visited && taskStatus.urls_visited.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">URLs Visited:</div>
              <div className="text-xs space-y-1">
                {taskStatus.urls_visited.map((url, index) => (
                  <div key={index} className="text-blue-600 truncate">{url}</div>
                ))}
              </div>
            </div>
          )}

          {taskStatus && taskStatus.actions && taskStatus.actions.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Actions Taken ({taskStatus.steps || taskStatus.actions.length}):</div>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {taskStatus.actions.map((action, index) => (
                  <div key={index} className="text-gray-600 truncate">• {action}</div>
                ))}
              </div>
            </div>
          )}

          {taskStatus && taskStatus.started_at && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Started: {new Date(taskStatus.started_at).toLocaleString()}
              {taskStatus.completed_at && (
                <> • Completed: {new Date(taskStatus.completed_at).toLocaleString()}</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
