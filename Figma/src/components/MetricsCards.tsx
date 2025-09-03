import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity } from "lucide-react"

const metrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "increase" as const,
    icon: DollarSign,
    description: "from last month"
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+15.3%",
    changeType: "increase" as const,
    icon: Users,
    description: "from last month"
  },
  {
    title: "Total Orders",
    value: "12,234",
    change: "-5.2%",
    changeType: "decrease" as const,
    icon: ShoppingCart,
    description: "from last month"
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "+2.5%",
    changeType: "increase" as const,
    icon: Activity,
    description: "from last month"
  },
]

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                {metric.changeType === "increase" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={metric.changeType === "increase" ? "text-green-600" : "text-red-600"}>
                  {metric.change}
                </span>
              </div>
              <span>{metric.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}