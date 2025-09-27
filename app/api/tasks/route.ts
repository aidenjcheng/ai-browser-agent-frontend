import { NextRequest, NextResponse } from 'next/server';
import { Agent, Browser, ChatGoogle } from 'browser-use';
import { getBrowserInstance, setBrowserInstance, getActiveTasks, setTask } from '@/lib/shared-state';

async function getBrowser() {
  let browser = getBrowserInstance();
  if (!browser) {
    try {
      browser = new Browser({
        executable_path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        user_data_dir: '~/Library/Application Support/Google/Chrome',
        profile_directory: 'Default',
      });
      await browser.start();
      setBrowserInstance(browser);
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw new Error('Failed to initialize browser');
    }
  }
  return browser;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task) {
      return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
    }

    const taskId = crypto.randomUUID();

    // Initialize browser and create agent
    const browserInstance = await getBrowser();
    const agent = new Agent({
      task: task,
      browser: browserInstance,
      llm: ChatGoogle({ model: 'gemini-flash' }),
    });

    // Store task info
    setTask(taskId, {
      id: taskId,
      status: 'running',
      task: task,
      started_at: new Date().toISOString(),
      agent: agent,
    });

    // Run task asynchronously
    runTaskAsync(taskId, agent);

    return NextResponse.json({
      id: taskId,
      status: 'running',
      task: task,
      message: 'Task started successfully'
    });

  } catch (error) {
    console.error('Error starting task:', error);
    return NextResponse.json(
      { error: 'Failed to start task' },
      { status: 500 }
    );
  }
}

async function runTaskAsync(taskId: string, agent: any) {
  try {
    const result = await agent.run();

    // Update task with completion info
    const existingTask = getActiveTasks().get(taskId);
    setTask(taskId, {
      ...existingTask,
      status: 'finished',
      completed_at: new Date().toISOString(),
      output: result.final_result(),
      urls_visited: result.urls(),
      actions: result.action_names(),
      steps: result.action_names().length,
    });

  } catch (error) {
    console.error(`Task ${taskId} failed:`, error);
    const existingTask = getActiveTasks().get(taskId);
    setTask(taskId, {
      ...existingTask,
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function GET() {
  const tasks = Array.from(getActiveTasks().values()).sort((a, b) =>
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  return NextResponse.json(tasks);
}
