"use client"

import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  label?: string
  disabled?: boolean
  className?: string
  includeTime?: boolean
}

function formatDateTime(date: Date | undefined, includeTime: boolean = true) {
  if (!date) {
    return ""
  }

  if (includeTime) {
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  } else {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "June 01, 2025 14:30",
  required = false,
  label,
  disabled = false,
  className,
  includeTime = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>()
  const [month, setMonth] = React.useState<Date | undefined>()
  const [inputValue, setInputValue] = React.useState("")
  const [timeValue, setTimeValue] = React.useState("")

  // Initialize from value prop
  React.useEffect(() => {
    if (value) {
      const parsedDate = new Date(value)
      if (isValidDate(parsedDate)) {
        setDate(parsedDate)
        setMonth(parsedDate)
        setInputValue(formatDateTime(parsedDate, includeTime))
        if (includeTime) {
          const hours = parsedDate.getHours().toString().padStart(2, '0')
          const minutes = parsedDate.getMinutes().toString().padStart(2, '0')
          setTimeValue(`${hours}:${minutes}`)
        }
      }
    } else {
      setDate(undefined)
      setMonth(undefined)
      setInputValue("")
      setTimeValue("")
    }
  }, [value, includeTime])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && includeTime) {
      // Preserve the current time when selecting a new date
      const [hours, minutes] = timeValue ? timeValue.split(':').map(Number) : [0, 0]
      selectedDate.setHours(hours, minutes, 0, 0)
    }

    setDate(selectedDate)
    setInputValue(formatDateTime(selectedDate, includeTime))

    if (selectedDate) {
      if (includeTime) {
        onChange(selectedDate.toISOString())
      } else {
        onChange(selectedDate.toISOString().split('T')[0])
      }
    } else {
      onChange("")
    }
    setOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value
    setTimeValue(newTimeValue)

    if (date && newTimeValue) {
      const [hours, minutes] = newTimeValue.split(':').map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(date)
        newDate.setHours(hours, minutes, 0, 0)
        setDate(newDate)
        setInputValue(formatDateTime(newDate, includeTime))
        onChange(newDate.toISOString())
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    const parsedDate = new Date(newValue)
    if (isValidDate(parsedDate)) {
      setDate(parsedDate)
      setMonth(parsedDate)
      if (includeTime) {
        onChange(parsedDate.toISOString())
        const hours = parsedDate.getHours().toString().padStart(2, '0')
        const minutes = parsedDate.getMinutes().toString().padStart(2, '0')
        setTimeValue(`${hours}:${minutes}`)
      } else {
        onChange(parsedDate.toISOString().split('T')[0])
      }
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
              <span className="sr-only">Select date{includeTime ? ' and time' : ''}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="p-0">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
              />
              {includeTime && (
                <div className="border-t border-border p-3 bg-background">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <Label htmlFor="time-input" className="text-sm font-medium">
                      Time:
                    </Label>
                    <Input
                      id="time-input"
                      type="time"
                      value={timeValue}
                      onChange={handleTimeChange}
                      className="w-24 h-8 text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}