import { NextRequest, NextResponse } from 'next/server';
import { getTask } from '@/lib/shared-state';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;
    const task = getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { id: taskId, status: 'not_found' },
        { status: 404 }
      );
    }

    // Return task data without the agent instance (not serializable)
    const { agent, ...taskData } = task;
    return NextResponse.json(taskData);

  } catch (error) {
    console.error('Error getting task:', error);
    return NextResponse.json(
      { error: 'Failed to get task' },
      { status: 500 }
    );
  }
}
