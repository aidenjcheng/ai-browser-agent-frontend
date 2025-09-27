import { NextRequest, NextResponse } from 'next/server';
import { getTask, setTask } from '@/lib/shared-state';

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;
    const task = getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status to paused
    setTask(taskId, {
      ...task,
      status: 'paused'
    });

    return NextResponse.json({
      message: 'Task marked as paused (local browser cannot be paused mid-execution)'
    });

  } catch (error) {
    console.error('Error pausing task:', error);
    return NextResponse.json(
      { error: 'Failed to pause task' },
      { status: 500 }
    );
  }
}
