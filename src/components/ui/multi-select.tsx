import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, // Will use DropdownMenuCheckboxItem instead for items
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'; // Assuming these are standard shadcn/ui exports
import { ChevronDown } from 'lucide-react';

// Define the shape of individual options and groups
export interface OptionItem<T> {
    label: string;
    value: T;
    id?: string; // Optional unique ID if value itself isn't a good key or is complex
}

export interface OptionGroup<T> {
    label: string;
    options: OptionItem<T>[];
}

// Props for the MultiSelect component
export interface MultiSelectProps<T> {
    options: OptionGroup<T>[];
    selected: T[]; // Array of selected values (e.g., selected Sensor objects)
    onChange: (selected: T[]) => void;
    // getValueKey: (item: T) => string | number; // Function to get a unique key from a selected item T
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
}

export function MultiSelect<T extends { id?: string | number }>({
    options,
    selected,
    onChange,
    // getValueKey,
    placeholder = 'Select items...',
    className,
    triggerClassName,
}: MultiSelectProps<T>) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Helper to get a unique key for comparison, assuming 'id' or the object itself if simple
    const getValueKey = React.useCallback((item: T): string | number => {
        if (typeof item === 'string' || typeof item === 'number') {
            return item;
        }
        if (item && typeof (item as any).id !== 'undefined') {
            return (item as any).id;
        }
        // As a fallback, stringify simple objects. For complex objects, an explicit id or getValueKey would be better.
        try {
            return JSON.stringify(item);
        } catch {
            console.warn("MultiSelect: Complex object used as value without an 'id' property. Selection might not work as expected. Consider providing an 'id' on your value objects or a custom 'getValueKey' prop.", item);
            return String(item); // Fallback to string coercion
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
        if (selected.length === 0) return placeholder;
        if (selected.length <= 2) {
            // Attempt to find labels for selected items.
            // This is a bit complex because 'selected' only contains values, not labels directly.
            // For simplicity, if options are flat, we can find labels.
            // If options are grouped, this is harder without iterating through all groups.
            // The previous implementation used labels directly in 'selected' prop of MultiSelect,
            // which is simpler for display but harder for value management.
            // Here, we assume 'selected' are actual values.
            // A more robust solution might involve passing a function to get display text for a value.
            const selectedLabels: string[] = [];
            options.forEach(group => {
                group.options.forEach(opt => {
                    if (selected.some(s => getValueKey(s) === getValueKey(opt.value))) {
                        selectedLabels.push(opt.label);
                    }
                });
            });
            if (selectedLabels.length > 0 && selectedLabels.length <=2) return selectedLabels.join(', ');
            // Fallback if labels can't be easily found or too many to list simply
        }
        return `${selected.length} item(s) selected`;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild className={className}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className={`w-full justify-between ${triggerClassName}`}
                >
                    {getSelectedItemsText()}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto">
                {options.map((group, groupIndex) => {
                    const groupItemsValues = group.options.map(opt => opt.value);
                    const selectedGroupItems = groupItemsValues.filter(v => selected.some(s => getValueKey(s) === getValueKey(v)));
                    const isAllSelectedInGroup = selectedGroupItems.length === groupItemsValues.length && groupItemsValues.length > 0;
                    const isPartiallySelectedInGroup = selectedGroupItems.length > 0 && selectedGroupItems.length < groupItemsValues.length;

                    return (
                        <React.Fragment key={group.label || groupIndex}>
                            {groupIndex > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="flex items-center">
                                <Checkbox
                                    id={`group-${group.label}`}
                                    checked={isAllSelectedInGroup}
                                    indeterminate={isPartiallySelectedInGroup}
                                    onCheckedChange={(checked) => handleSelectAllGroup(group.options, !!checked)}
                                    className="mr-2"
                                />
                                {group.label}
                            </DropdownMenuLabel>
                            {group.options.map((option) => {
                                const isSelected = selected.some(sel => getValueKey(sel) === getValueKey(option.value));
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={option.id || (typeof option.value === 'string' || typeof option.value === 'number' ? option.value : option.label)}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleSelectItem(option.value, !!checked)}
                                        // onSelect={(event) => event.preventDefault()} // Prevent closing on select
                                    >
                                        {option.label}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
                {options.length === 0 && (
                    <DropdownMenuItem disabled>No options available</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Export the component for use in other parts of the application
export default MultiSelect;
