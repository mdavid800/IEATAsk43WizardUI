import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { ChevronDown, X } from 'lucide-react';

// Define the shape of individual options and groups
export interface OptionItem<T> {
    label: string;
    value: T;
    id?: string;
}

export interface OptionGroup<T> {
    label: string;
    options: OptionItem<T>[];
}

// Props for the MultiSelect component
export interface MultiSelectProps<T> {
    options: OptionGroup<T>[];
    selected: T[];
    onChange: (selected: T[]) => void;
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
}

export function MultiSelect<T extends { model?: string; serial_number?: string }>({
    options,
    selected,
    onChange,
    placeholder = 'Select items...',
    className,
    triggerClassName,
}: MultiSelectProps<T>) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Helper to get a unique key for comparison
    const getValueKey = React.useCallback((item: T): string => {
        if (typeof item === 'string' || typeof item === 'number') {
            return String(item);
        }
        if (item && typeof (item as any).id !== 'undefined') {
            return String((item as any).id);
        }
        // For sensors, use model + serial_number as unique key
        if (item && 'model' in item && 'serial_number' in item) {
            return `${item.model}-${item.serial_number}`;
        }
        try {
            return JSON.stringify(item);
        } catch {
            return String(item);
        }
    }, []);

    const handleSelectAllGroup = (groupOptions: OptionItem<T>[], groupSelected: boolean) => {
        const groupValues = groupOptions.map(opt => opt.value);
        let newSelected = [...selected];

        if (groupSelected) {
            // Add all items from this group that aren't already selected
            groupValues.forEach(value => {
                if (!newSelected.some(sel => getValueKey(sel) === getValueKey(value))) {
                    newSelected.push(value);
                }
            });
        } else {
            // Remove all items from this group
            newSelected = newSelected.filter(sel => !groupValues.some(v => getValueKey(v) === getValueKey(sel)));
        }
        onChange(newSelected);
    };

    const handleSelectItem = (itemValue: T, isSelected: boolean) => {
        let newSelected = [...selected];
        if (isSelected) {
            if (!newSelected.some(sel => getValueKey(sel) === getValueKey(itemValue))) {
                newSelected.push(itemValue);
            }
        } else {
            newSelected = newSelected.filter(sel => getValueKey(sel) !== getValueKey(itemValue));
        }
        onChange(newSelected);
    };

    const getSelectedItemsText = () => {
        if (!selected || selected.length === 0) return placeholder;
        if (selected.length <= 2) {
            const selectedLabels: string[] = [];
            options.forEach(group => {
                group.options.forEach(opt => {
                    if (selected.some(s => getValueKey(s) === getValueKey(opt.value))) {
                        selectedLabels.push(opt.label);
                    }
                });
            });
            if (selectedLabels.length > 0 && selectedLabels.length <= 2) {
                return selectedLabels.join(', ');
            }
        }
        return `${selected.length} item(s) selected`;
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild className={className}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className={`w-full justify-between border-border hover:border-primary/50 bg-background text-foreground ${triggerClassName}`}
                >
                    <span className="truncate">{getSelectedItemsText()}</span>
                    <div className="flex items-center gap-2">
                        {selected && selected.length > 0 && (
                            <X 
                                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer" 
                                onClick={clearSelection}
                            />
                        )}
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto bg-background border border-border shadow-lg rounded-lg p-2"
                align="start"
            >
                {options.map((group, groupIndex) => {
                    const groupItemsValues = group.options.map(opt => opt.value);
                    const selectedGroupItems = groupItemsValues.filter(v => 
                        selected && selected.some(s => getValueKey(s) === getValueKey(v))
                    );
                    const isAllSelectedInGroup = selectedGroupItems.length === groupItemsValues.length && groupItemsValues.length > 0;
                    const isPartiallySelectedInGroup = selectedGroupItems.length > 0 && selectedGroupItems.length < groupItemsValues.length;

                    return (
                        <React.Fragment key={group.label || groupIndex}>
                            {groupIndex > 0 && <DropdownMenuSeparator className="my-2" />}
                            
                            {/* Group Header with Checkbox */}
                            <div className="flex items-center px-3 py-2 bg-muted/50 rounded-md mb-1 hover:bg-muted/70 transition-colors">
                                <Checkbox
                                    id={`group-${group.label}`}
                                    checked={isAllSelectedInGroup}
                                    ref={(node) => {
                                        if (node) node.indeterminate = isPartiallySelectedInGroup;
                                    }}
                                    onCheckedChange={(checked) => handleSelectAllGroup(group.options, !!checked)}
                                    className="mr-3"
                                />
                                <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
                                    {group.label}
                                </DropdownMenuLabel>
                            </div>

                            {/* Group Options */}
                            <div className="ml-4 space-y-1">
                                {group.options.map((option) => {
                                    const isSelected = selected && selected.some(sel => getValueKey(sel) === getValueKey(option.value));
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={option.id || getValueKey(option.value)}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelectItem(option.value, !!checked)}
                                            className="pl-6 pr-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer"
                                            onSelect={(event) => event.preventDefault()}
                                        >
                                            <span className="ml-2">{option.label}</span>
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                            </div>
                        </React.Fragment>
                    );
                })}
                {options.length === 0 && (
                    <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
                        No options available
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default MultiSelect;