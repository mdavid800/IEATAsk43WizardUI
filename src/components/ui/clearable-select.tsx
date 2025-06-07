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
  const triggerPadding = showClearButton ? "pr-14" : "pr-8"

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
              <SelectItem value="" className="text-muted-foreground italic">
                {placeholder}
              </SelectItem>
              <hr className="my-1 border-border" />
            </>
          )}
          {children}
        </SelectContent>
      </Select>
      
      {/* Clear button positioned outside of SelectTrigger to prevent click conflicts */}
      {showClearButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-transparent opacity-50 hover:opacity-100 z-20 pointer-events-auto"
          onClick={handleClear}
          onMouseDown={handleClear} // Also handle mousedown to ensure it triggers before any other events
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}