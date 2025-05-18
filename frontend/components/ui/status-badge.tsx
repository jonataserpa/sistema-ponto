import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "emitida":
      case "confirmado":
      case "normal":
      case "pago":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "em trânsito":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "aguardando":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "baixo":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", getStatusColor(), className)}>{status}</span>
  )
}
