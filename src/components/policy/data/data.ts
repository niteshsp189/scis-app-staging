import {
    CheckCircledIcon,
    CircleIcon,
    CrossCircledIcon,
    QuestionMarkCircledIcon,
    StopwatchIcon,
    PauseIcon,
  } from "@radix-ui/react-icons"
  
  export const statuses = [
    {
      value: "Active",
      label: "Active",
      icon: CheckCircledIcon,
    },
    {
      value: "Pending",
      label: "Pending",
      icon: CircleIcon,
    },
    {
      value: "Suspended",
      label: "Suspended",
      icon: PauseIcon,
    },
    {
      value: "Lapsed",
      label: "Lapsed",
      icon: StopwatchIcon,
    },
    {
      value: "Cancelled",
      label: "Cancelled",
      icon: CrossCircledIcon,
    },
    {
        value: "Expired",
        label: "Expired",
        icon: QuestionMarkCircledIcon,
    }
  ]
  