'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { loadAccounts, loadActivities, loadTasks, saveActivities, saveTasks } from '@/lib/storage';
import { ActivityRecord, ActivityType, FollowUpTask, TaskStatus } from '@/lib/types';

const quickActivityTypes: ActivityType[] = ['Email', 'Call', 'LinkedIn', 'Note'];

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueAt, setTaskDueAt] = useState('');

  const account = useMemo(() => loadAccounts().find((item) => item.id === params.id) ?? null, [params.id]);

  useEffect(() => {
    setActivities(loadActivities().filter((item) => item.accountId === params.id));
    setTasks(loadTasks().filter((item) => item.accountId === params.id));
  }, [params.id]);

  if (!account) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <Link className="btn-secondary" href="/accounts">← Back to Accounts</Link>
        <div className="card mt-6 p-10 text-center text-slate-500">Account not found.</div>
      </main>
    );
  }

  const addActivity = (type: ActivityType) => {
    const next: ActivityRecord = {
      id: crypto.randomUUID(),
      accountId: account.id,
      type,
      summary: `${type} follow-up logged`,
      timestamp: new Date().toISOString(),
    };
    const merged = [...loadActivities(), next];
    saveActivities(merged);
    setActivities(merged.filter((item) => item.accountId === account.id));
  };

  const addTask = (event: FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim() || !taskDueAt) return;
    const nextTask: FollowUpTask = {
      id: crypto.randomUUID(),
      accountId: account.id,
      title: taskTitle.trim(),
      dueAt: taskDueAt,
      status: 'Open',
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    };
    const merged = [...loadTasks(), nextTask];
    saveTasks(merged);
    setTasks(merged.filter((item) => item.accountId === account.id));
    setTaskTitle('');
    setTaskDueAt('');
  };

  const toggleTask = (taskId: string) => {
    const merged = loadTasks().map((task) => {
      if (task.id !== taskId) return task;
      const nextStatus: TaskStatus = task.status === 'Open' ? 'Done' : 'Open';
      return { ...task, status: nextStatus };
    });
    saveTasks(merged);
    setTasks(merged.filter((item) => item.accountId === account.id));
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="btn-secondary" href="/accounts">← Back to Accounts</Link>
        <div className="flex gap-2">
          {quickActivityTypes.map((type) => (
            <button key={type} className="btn-secondary" onClick={() => addActivity(type)}>Log {type}</button>
          ))}
        </div>
      </div>

      <section className="card p-6">
        <h1 className="text-2xl font-bold">{account.businessName}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{account.primaryContact} · {account.email}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p><strong>Website:</strong> <a className="text-brand-600" href={account.website} rel="noreferrer" target="_blank">{account.website}</a></p>
          <p><strong>Location:</strong> {account.city}, {account.state}</p>
          <p><strong>Niche:</strong> {account.niche}</p>
          <p><strong>Status:</strong> {account.status}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Follow-up Tasks</h2>
          <form className="mt-3 flex flex-wrap gap-2" onSubmit={addTask}>
            <input className="field flex-1" onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add follow-up task..." value={taskTitle} />
            <input className="field w-[180px]" onChange={(event) => setTaskDueAt(event.target.value)} type="date" value={taskDueAt} />
            <button className="btn-primary" type="submit">Add Task</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <p className={task.status === 'Done' ? 'line-through opacity-70' : ''}>{task.title}</p>
                  <p className="text-xs text-slate-500">Due {new Date(task.dueAt).toLocaleDateString()}</p>
                </div>
                <button className="btn-secondary" onClick={() => toggleTask(task.id)}>{task.status === 'Done' ? 'Reopen' : 'Done'}</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Activity Feed</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {activities.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((activity) => (
              <li key={activity.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="font-medium">{activity.type}</p>
                <p>{activity.summary}</p>
                <p className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
