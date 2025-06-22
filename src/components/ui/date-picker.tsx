import * as React from 'react';
import { Calendar, Clock, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showYearMonthPicker, setShowYearMonthPicker] = React.useState(false);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

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

  // Position popup properly
  React.useEffect(() => {
    if (isOpen && popupRef.current && containerRef.current) {
      const container = containerRef.current;
      const popup = popupRef.current;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Reset position
      popup.style.top = '';
      popup.style.bottom = '';
      popup.style.left = '';
      popup.style.right = '';
      
      // Determine if popup should appear above or below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const popupHeight = 400; // Approximate popup height
      
      if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
        // Position below
        popup.style.top = '100%';
        popup.style.marginTop = '8px';
      } else {
        // Position above
        popup.style.bottom = '100%';
        popup.style.marginBottom = '8px';
      }
      
      // Determine horizontal position
      const spaceRight = viewportWidth - rect.left;
      const popupWidth = 320; // Approximate popup width
      
      if (spaceRight >= popupWidth) {
        popup.style.left = '0';
      } else {
        popup.style.right = '0';
      }
    }
  }, [isOpen]);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearMonthPicker(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowYearMonthPicker(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
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

  const handleMonthYearChange = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setCurrentMonth(newDate);
    setShowYearMonthPicker(false);
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

  const renderYearMonthPicker = () => {
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    // Generate years from 1900 to 2100
    const years = [];
    for (let year = 1900; year <= 2100; year++) {
      years.push(year);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Select Month and Year</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowYearMonthPicker(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Year Selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Year</label>
            <select
              value={currentYear}
              onChange={(e) => handleMonthYearChange(currentMonthIndex, parseInt(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Month Selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Month</label>
            <select
              value={currentMonthIndex}
              onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentYear)}
              className="w-full h-10 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
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
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9999]" />
          
          {/* Popup */}
          <div 
            ref={popupRef}
            className="absolute z-[10000] bg-background border border-border rounded-xl shadow-2xl p-6 min-w-[320px] max-w-[350px]"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
          >
            {showYearMonthPicker ? (
              renderYearMonthPicker()
            ) : (
              <>
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="h-8 w-8 hover:bg-primary/10 border border-border/30 flex items-center justify-center rounded-lg transition-colors bg-background text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Previous month</span>
                  </button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowYearMonthPicker(true)}
                    className="text-base font-semibold text-foreground hover:bg-primary/10 flex items-center gap-1 px-3 py-1 rounded-lg"
                  >
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="h-8 w-8 hover:bg-primary/10 border border-border/30 flex items-center justify-center rounded-lg transition-colors bg-background text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <ChevronRight className="h-5 w-5" />
                    <span className="sr-only">Next month</span>
                  </button>
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
                  <div className="border-t border-border pt-4 mb-4">
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
                <div className="flex gap-2 pt-4 border-t border-border">
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}