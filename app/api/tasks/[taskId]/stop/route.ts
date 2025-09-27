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

    // Update task status to stopped
    setTask(taskId, {
      ...task,
      status: 'stopped',
      completed_at: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Task marked as stopped (local browser cannot be stopped mid-execution)'
    });

  } catch (error) {
    console.error('Error stopping task:', error);
    return NextResponse.json(
      { error: 'Failed to stop task' },
      { status: 500 }
    );
  }
}
