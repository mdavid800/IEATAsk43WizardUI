"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  label?: string
  disabled?: boolean
  className?: string
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

function combineDateTime(selectedDate: Date, timeStr: string) {
  const result = new Date(selectedDate)
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":" ).map(Number)
    result.setHours(hours || 0)
    result.setMinutes(minutes || 0)
    result.setSeconds(0)
    result.setMilliseconds(0)
  }
  return result.toISOString()
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "June 01, 2025",
  required = false,
  label,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>()
  const [month, setMonth] = React.useState<Date | undefined>()
  const [inputValue, setInputValue] = React.useState("")
  const [time, setTime] = React.useState("")

  // Initialize from value prop
  React.useEffect(() => {
    if (value) {
      const parsedDate = new Date(value)
      if (isValidDate(parsedDate)) {
        setDate(parsedDate)
        setMonth(parsedDate)
        setInputValue(formatDate(parsedDate))
        setTime(parsedDate.toISOString().substring(11, 16))
      }
    } else {
      setDate(undefined)
      setMonth(undefined)
      setInputValue("")
      setTime("")
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setInputValue(formatDate(selectedDate))
    if (selectedDate) {
      const combined = combineDateTime(selectedDate, time)
      onChange(combined)
    } else {
      onChange("")
    }
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    const parsedDate = new Date(newValue)
    if (isValidDate(parsedDate)) {
      setDate(parsedDate)
      setMonth(parsedDate)
      const combined = combineDateTime(parsedDate, time)
      onChange(combined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    if (date && newTime) {
      const combined = combineDateTime(date, newTime)
      onChange(combined)
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          className="bg-background pr-10"
          required={required}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0 hover:!translate-y-[-50%]"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Input
        type="time"
        value={time}
        className="bg-background"
        required={required}
        disabled={disabled}
        onChange={handleTimeChange}
      />
    </div>
  )
}