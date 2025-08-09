import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { CalendarIcon, Clock, User, MapPin } from 'lucide-react';

interface TimeSlot {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

interface SchedulerProps {
  title: string;
  type?: 'meeting' | 'task' | 'reminder';
  onSchedule: (data: {
    date: Date;
    time: TimeSlot;
    title: string;
    description?: string;
    attendees?: string[];
    location?: string;
  }) => void;
  onCancel?: () => void;
  availableSlots?: TimeSlot[];
  isCompleted?: boolean;
}

export function Scheduler({ 
  title, 
  type = 'meeting',
  onSchedule, 
  onCancel,
  availableSlots,
  isCompleted = false
}: SchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState<string>('');

  const defaultTimeSlots: TimeSlot[] = [
    { hour: 9, minute: 0, period: 'AM' },
    { hour: 9, minute: 30, period: 'AM' },
    { hour: 10, minute: 0, period: 'AM' },
    { hour: 10, minute: 30, period: 'AM' },
    { hour: 11, minute: 0, period: 'AM' },
    { hour: 11, minute: 30, period: 'AM' },
    { hour: 1, minute: 0, period: 'PM' },
    { hour: 1, minute: 30, period: 'PM' },
    { hour: 2, minute: 0, period: 'PM' },
    { hour: 2, minute: 30, period: 'PM' },
    { hour: 3, minute: 0, period: 'PM' },
    { hour: 3, minute: 30, period: 'PM' },
    { hour: 4, minute: 0, period: 'PM' },
    { hour: 4, minute: 30, period: 'PM' },
  ];

  const timeSlots = availableSlots || defaultTimeSlots;

  const formatTime = (slot: TimeSlot) => {
    const minute = slot.minute.toString().padStart(2, '0');
    return `${slot.hour}:${minute} ${slot.period}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !eventTitle.trim()) return;

    onSchedule({
      date: selectedDate,
      time: selectedTime,
      title: eventTitle,
      description: description || undefined,
      attendees: attendees ? attendees.split(',').map(a => a.trim()) : undefined,
      location: location || undefined,
    });
  };

  const canSubmit = selectedDate && selectedTime && eventTitle.trim();

  return (
    <Card className="p-4 max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{title}</h4>
          {isCompleted && (
            <Badge variant="secondary" className="text-xs font-normal">
              Scheduled
            </Badge>
          )}
        </div>

        {!isCompleted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="eventTitle" className="text-sm font-medium">
                {type === 'meeting' ? 'Meeting Title' : type === 'task' ? 'Task Title' : 'Reminder Title'}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="eventTitle"
                placeholder={`Enter ${type} title`}
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="text-sm font-normal"
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select Date <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select Time <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedTime === slot ? "default" : "outline"}
                      className="text-xs font-normal h-8"
                      onClick={() => setSelectedTime(slot)}
                    >
                      {formatTime(slot)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {type === 'meeting' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Meeting location or video link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-sm font-normal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees" className="text-sm font-medium flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Attendees
                  </Label>
                  <Input
                    id="attendees"
                    placeholder="Email addresses, comma separated"
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    className="text-sm font-normal"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="description"
                placeholder={`Additional details about this ${type}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm font-normal"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 text-sm font-medium"
              >
                <Clock className="w-3 h-3 mr-1" />
                Schedule {type}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="text-sm font-normal"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {isCompleted && (
          <div className="text-center py-4">
            <CalendarIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm font-normal text-muted-foreground">
              {type} has been scheduled successfully
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}