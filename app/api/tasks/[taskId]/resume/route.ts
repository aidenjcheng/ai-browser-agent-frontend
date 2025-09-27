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

    // Update task status to running
    setTask(taskId, {
      ...task,
      status: 'running'
    });

    return NextResponse.json({
      message: 'Task marked as running (local browser cannot be resumed)'
    });

  } catch (error) {
    console.error('Error resuming task:', error);
    return NextResponse.json(
      { error: 'Failed to resume task' },
      { status: 500 }
    );
  }
}
