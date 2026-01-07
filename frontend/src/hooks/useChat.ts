import { useState, useCallback } from 'react';
import { chat, executePlan } from '../helpers/api';
import { Message } from '../pages/PopupPage/components/MessageList/MessageList';

export function useChat(jwt: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  async function sendMessage(message: string) {
    if (!jwt) {
      setError('Not connected. Please connect Google first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = { role: 'user', text: message };
      setMessages((prev) => [...prev, userMessage]);

      // Get action plan
      const response = await chat(jwt, message);
      const assistantMessage: Message = {
        role: 'assistant',
        plan: response.plan,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error in chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate action plan');
    } finally {
      setLoading(false);
    }
  }

  const cancelPlan = useCallback(() => {
    // Remove the last assistant message with plan
    setMessages((prev) =>
      prev.filter(
        (msg, idx) =>
          !(idx === prev.length - 1 && msg.role === 'assistant' && msg.plan)
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const executeActionPlan = useCallback(async (plan: Message['plan']) => {
    console.log('🚀 executeActionPlan called', {
      hasJwt: !!jwt,
      hasPlan: !!plan,
      plan,
    });

    if (!jwt || !plan) {
      const errorMsg = !jwt ? 'Missing JWT' : 'Missing plan';
      console.error('❌ Cannot execute:', errorMsg);
      setError(`Cannot execute: ${errorMsg}`);
      return;
    }

    try {
      setExecuting(true);
      setError(null);

      console.log('📤 Calling executePlan API...');
      const result = await executePlan(jwt, plan);
      console.log('✅ ExecutePlan result:', result);
      
      // Add success message
      const successMessage: Message = {
        role: 'assistant',
        text: result.message || `Successfully ${result.action.toLowerCase()} ${result.emailsAffected} email(s)`,
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (err) {
      console.error('Error executing plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setExecuting(false);
    }
  }, [jwt]);

  return {
    messages,
    loading,
    error,
    executing,
    sendMessage,
    cancelPlan,
    clearMessages,
    executeActionPlan,
  };
}

