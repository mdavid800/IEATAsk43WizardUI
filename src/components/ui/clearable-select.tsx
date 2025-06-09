import * as React from "react"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Button } from "./button"
import { cn } from "../../utils/cn"

export interface ClearableSelectProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  clearable?: boolean
}

export function ClearableSelect({
  value,
  onValueChange,
  placeholder = "Select...",
  children,
  className,
  disabled = false,
  clearable = true,
  ...props
}: ClearableSelectProps) {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onValueChange(undefined)
  }

  // Determine padding based on whether clear button is shown
  const showClearButton = clearable && value && !disabled
  const triggerPadding = showClearButton ? "pl-10 pr-8" : "pl-3 pr-8" // Move padding to left side

  return (
    <div className="relative">
      <Select
        value={value || ""}
        onValueChange={(newValue) => {
          if (newValue === "") {
            onValueChange(undefined)
          } else {
            onValueChange(newValue)
          }
        }}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger className={cn(triggerPadding, className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clearable && (
            <>
              <SelectItem value="\" className="text-muted-foreground italic">
                {placeholder}
              </SelectItem>
              <hr className="my-1 border-border" />
            </>
          )}
          {children}
        </SelectContent>
      </Select>
      
      {/* Clear button positioned on the LEFT side to match sensors dropdown styling */}
      {showClearButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent opacity-50 hover:opacity-100 z-20 pointer-events-auto"
          onClick={handleClear}
          onMouseDown={handleClear}
          tabIndex={-1}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}