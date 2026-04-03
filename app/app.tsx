'use client'

import { useActorQandA } from '@/hooks/useActorQandA'
import { ACTOR_INFO_TEXT } from '@/lib/actorInfo'
import { fetchCreateAgentTaskClientToken } from '@/lib/fetchCreateAgentTaskClientToken'
import { AgentTaskProgress } from '@fencyai/react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

/**
 * Zod schema for structured chat completion responses.
 * Used when the user asks questions about actor information (e.g. "what is the age of johnny depp").
 */
export const actorResponseSchema = z.object({
    actorName: z.string().describe('Name of the actor'),
    age: z.string().describe('Age of the actor'),
})

export default function App() {
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)
    const { agentTasks, isSubmitting, sendMessage } = useActorQandA({
        fetchCreateAgentTaskClientToken,
        actorInfoText: ACTOR_INFO_TEXT,
        jsonSchema: JSON.stringify(z.toJSONSchema(actorResponseSchema)),
        model: 'anthropic/claude-sonnet-4.5',
    })

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }, [agentTasks])

    useEffect(() => {
        if (!isSubmitting) return
        const id = setInterval(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
        }, 100)
        return () => clearInterval(id)
    }, [isSubmitting])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!input.trim() || isSubmitting) return
        const text = input
        setInput('')
        await sendMessage(text)
    }

    return (
        <div className="mx-auto flex h-screen max-w-5xl flex-col">
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto p-4"
            >
                <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <h2 className="mb-2 font-semibold">Actor information</h2>
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                        {ACTOR_INFO_TEXT}
                    </p>
                </div>

                <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <h2 className="mb-2 font-semibold">Response schema</h2>
                    <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Questions will return structured JSON matching this
                        schema:
                    </p>
                    <pre className="overflow-x-auto rounded bg-neutral-100 p-3 text-xs text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                        {JSON.stringify(
                            z.toJSONSchema(actorResponseSchema),
                            null,
                            2
                        )}
                    </pre>
                </div>

                {agentTasks.map((task) => {
                    if (task.params.type !== 'StructuredChatCompletion') return null
                    return (
                    <div key={task.taskKey} className="mb-4">
                        <div className="mb-2 ml-auto w-fit max-w-[80%] rounded-lg bg-blue-500 px-3 py-2 text-right text-white dark:bg-blue-800">
                            {task.params.messages.at(-1)?.content}
                        </div>
                        <div className="mb-2 mr-auto max-w-[80%]">
                            {task.error ? (
                                <div className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    {task.error.message}
                                </div>
                            ) : (
                                <AgentTaskProgress agentTask={task} />
                            )}
                        </div>
                    </div>
                    )
                })}
            </div>
            <form
                onSubmit={handleSubmit}
                className="flex shrink-0 gap-2 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question, e.g. what is the age of johnny depp"
                    disabled={isSubmitting}
                    className="min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-400"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !input.trim()}
                    className="rounded border border-neutral-300 bg-neutral-100 px-4 py-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800"
                >
                    Submit
                </button>
            </form>
        </div>
    )
}
