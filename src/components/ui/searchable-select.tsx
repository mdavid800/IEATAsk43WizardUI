import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Input } from "./input"

export interface SearchableSelectOption {
    value: string
    label: string
    description?: string
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value?: string
    onValueChange: (value: string | undefined) => void
    placeholder?: string
    searchPlaceholder?: string
    className?: string
    disabled?: boolean
    clearable?: boolean
    emptyMessage?: string
}

// Simple tooltip component
const Tooltip = ({ children, content, disabled }: { children: React.ReactNode, content?: string, disabled?: boolean }) => {
    const [isVisible, setIsVisible] = React.useState(false)

    if (!content || disabled) {
        return <>{children}</>
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap left-full ml-2 top-1/2 -translate-y-1/2 max-w-xs">
                    {content}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
            )}
        </div>
    )
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search options...",
    className,
    disabled = false,
    clearable = true,
    emptyMessage = "No options found.",
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search.trim()) return options

        const searchLower = search.toLowerCase().trim()
        return options.filter(option =>
            option.label.toLowerCase().includes(searchLower) ||
            option.value.toLowerCase().includes(searchLower) ||
            (option.description && option.description.toLowerCase().includes(searchLower))
        )
    }, [options, search])

    const selectedOption = options.find(option => option.value === value)

    const handleSelect = (optionValue: string) => {
        if (optionValue === value) {
            // If clicking the same option, clear it if clearable
            if (clearable) {
                onValueChange(undefined)
            }
        } else {
            onValueChange(optionValue)
        }
        setOpen(false)
        setSearch("")
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onValueChange(undefined)
    }

    const showClearButton = clearable && value && !disabled

    return (
        <div className="relative">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            showClearButton ? "pl-8 pr-2" : "pl-3 pr-2",
                            !value && "text-muted-foreground",
                            className
                        )}
                        disabled={disabled}
                    >
                        <span className="truncate">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b">
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8"
                                autoFocus
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {emptyMessage}
                                </div>
                            ) : (
                                <div className="p-1">
                                    {filteredOptions.map((option) => (
                                        <Tooltip key={option.value} content={option.description}>
                                            <button
                                                onClick={() => handleSelect(option.value)}
                                                className={cn(
                                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                    value === option.value && "bg-accent text-accent-foreground"
                                                )}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === option.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <span>{option.label}</span>
                                            </button>
                                        </Tooltip>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Clear button positioned on the LEFT side */}
            {showClearButton && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent opacity-50 hover:opacity-100 z-20 pointer-events-auto"
                    onClick={handleClear}
                    onMouseDown={handleClear}
                    tabIndex={-1}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
} 