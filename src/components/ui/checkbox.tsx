import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ ...props }, ref) => (
    <CheckboxPrimitive.Root ref={ref} {...props} />
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }