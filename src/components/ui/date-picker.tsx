import * as React from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './button';
import { Input } from './input';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includeTime?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  includeTime = false,
  disabled = false,
  className,
  id,
  name,
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [timeValue, setTimeValue] = React.useState('00:00');
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Initialize from value prop
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
        if (includeTime) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          setTimeValue(`${hours}:${minutes}`);
          setInputValue(formatDateTime(date));
        } else {
          setInputValue(formatDate(date));
        }
      }
    } else {
      setSelectedDate(null);
      setInputValue('');
      setTimeValue('00:00');
    }
  }, [value, includeTime]);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const formatDateTime = (date: Date) => {
    const dateStr = formatDate(date);
    const timeStr = date.toTimeString().slice(0, 5); // HH:MM format
    return `${dateStr} ${timeStr}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(date);
    
    if (includeTime) {
      // Combine selected date with current time
      const [hours, minutes] = timeValue.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      
      const isoString = newDate.toISOString();
      setInputValue(formatDateTime(newDate));
      onChange(isoString);
    } else {
      const isoString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      setInputValue(formatDate(date));
      onChange(isoString);
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      
      const isoString = newDate.toISOString();
      setInputValue(formatDateTime(newDate));
      onChange(isoString);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);

    // Try to parse the input
    if (inputValue) {
      const date = new Date(inputValue);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
        onChange(includeTime ? date.toISOString() : date.toISOString().split('T')[0]);
      }
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  const clearDate = () => {
    setSelectedDate(null);
    setInputValue('');
    setTimeValue('00:00');
    onChange('');
    inputRef.current?.focus();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={cn(
            "h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
            isTodayDate && !isSelected && "bg-accent/20 text-accent-foreground font-semibold",
            !isSelected && !isTodayDate && "text-foreground hover:text-primary"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "pr-20 transition-all duration-200",
            isOpen && "ring-2 ring-primary/30 border-primary",
            className
          )}
          onClick={() => !disabled && setIsOpen(true)}
          onFocus={() => !disabled && setIsOpen(true)}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-transparent opacity-50 hover:opacity-100"
              onClick={clearDate}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-transparent opacity-50 hover:opacity-100"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            tabIndex={-1}
          >
            {includeTime ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-xl shadow-xl p-6 min-w-[320px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            
            <h3 className="text-base font-semibold text-foreground">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 hover:bg-primary/10"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendarGrid()}
          </div>

          {/* Time Picker */}
          {includeTime && (
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Time</label>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
                if (!includeTime) {
                  setIsOpen(false);
                }
              }}
              className="flex-1"
            >
              Today
            </Button>
            {includeTime && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}