import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmTasks(initialParams = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getTasks(params);
      if (res.data?.success) {
        setTasks(res.data.tasks);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err.response?.data?.message || 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = async (id, completionReason, resolutionOutcome) => {
    try {
      const res = await crmApi.updateTaskStatus(id, {
        status: 'completed',
        completionReason,
        resolutionOutcome
      });
      if (res.data?.success) {
        // Optimistic update
        setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to complete task'
      };
    }
  };

  const createTask = async (taskData) => {
    try {
      const res = await crmApi.createTask(taskData);
      if (res.data?.success) {
        setTasks((prev) => [res.data.task, ...prev]);
        return { success: true, task: res.data.task };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to create task'
      };
    }
  };

  return {
    tasks,
    loading,
    error,
    params,
    setParams,
    refresh: fetchTasks,
    completeTask,
    createTask
  };
}
