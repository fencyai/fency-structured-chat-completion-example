import { useState } from 'react'
import { useAgentTasks } from '@fencyai/react'
import type { UseAgentTasksProps, AgentTask } from '@fencyai/react'
import type { AgentTaskModel } from '@fencyai/js'

interface UseActorQandAProps extends UseAgentTasksProps {
    actorInfoText: string
    jsonSchema: string
    model: AgentTaskModel
}

interface UseActorQandA {
    agentTasks: AgentTask[]
    isSubmitting: boolean
    sendMessage: (question: string) => Promise<void>
}

export function useActorQandA({
    actorInfoText,
    jsonSchema,
    model,
    ...agentTasksProps
}: UseActorQandAProps): UseActorQandA {
    const { agentTasks, createAgentTask } = useAgentTasks(agentTasksProps)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function sendMessage(question: string) {
        const trimmed = question.trim()
        if (!trimmed || isSubmitting) return

        setIsSubmitting(true)

        const systemContent = `Answer the user's question using ONLY the following information. Do not use any external knowledge.

${actorInfoText}`

        const messages = [
            { role: 'system' as const, content: systemContent },
            { role: 'user' as const, content: trimmed },
        ]

        try {
            await createAgentTask({
                type: 'StructuredChatCompletion',
                messages,
                model,
                jsonSchema,
            })
        } catch {
            // Task error will be surfaced via task.error
        } finally {
            setIsSubmitting(false)
        }
    }

    return { agentTasks, isSubmitting, sendMessage }
}
