import { Badge } from "./ui/badge"
import { CheckCircle, AlertCircle, Clock, User, ShoppingCart } from "lucide-react"

const activities = [
  {
    action: "New user registered",
    user: "John Smith",
    time: "2 minutes ago",
    icon: User,
    status: "success" as const
  },
  {
    action: "Order completed",
    user: "Order #1234",
    time: "5 minutes ago",
    icon: CheckCircle,
    status: "success" as const
  },
  {
    action: "Payment pending",
    user: "Order #1235",
    time: "10 minutes ago",
    icon: Clock,
    status: "warning" as const
  },
  {
    action: "New order placed",
    user: "Sarah Johnson",
    time: "15 minutes ago",
    icon: ShoppingCart,
    status: "info" as const
  },
  {
    action: "System error resolved",
    user: "Server Monitor",
    time: "20 minutes ago",
    icon: AlertCircle,
    status: "success" as const
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${
            activity.status === "success" ? "bg-green-100 text-green-600" :
            activity.status === "warning" ? "bg-yellow-100 text-yellow-600" :
            "bg-blue-100 text-blue-600"
          }`}>
            <activity.icon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{activity.action}</p>
            <p className="text-sm text-muted-foreground">{activity.user}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  )
}