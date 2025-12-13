
import { format, isSameDay, isWithinInterval } from "date-fns";

interface Holiday {
  id: number;
  name: string;
  date: Date;
  type: "public" | "company" | "emergency";
}

interface Leave {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  type: "full-day" | "partial-day";
  reason: string;
  status: "approved" | "pending" | "rejected";
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const checkAvailability = (
  employeeId: number,
  appointmentDate: Date,
  appointmentTime: string,
  holidays: Holiday[] = [],
  leaves: Leave[] = []
): { available: boolean; reason?: string } => {
  
  // Check if date is a holiday
  const isHoliday = holidays.some(holiday => 
    isSameDay(holiday.date, appointmentDate)
  );
  
  if (isHoliday) {
    const holiday = holidays.find(h => isSameDay(h.date, appointmentDate));
    return {
      available: false,
      reason: `${holiday?.name} - Office closed`
    };
  }

  // Check if employee is on leave
  const employeeLeaves = leaves.filter(leave => 
    leave.employeeId === employeeId && 
    leave.status === "approved"
  );

  for (const leave of employeeLeaves) {
    const isDateInLeave = isWithinInterval(appointmentDate, {
      start: leave.startDate,
      end: leave.endDate
    });

    if (isDateInLeave) {
      if (leave.type === "full-day") {
        return {
          available: false,
          reason: `Employee on leave - ${leave.reason}`
        };
      }

      // Check partial day leave
      if (leave.type === "partial-day" && leave.startTime && leave.endTime) {
        const appointmentTimeNum = timeStringToMinutes(appointmentTime);
        const leaveStartNum = timeStringToMinutes(leave.startTime);
        const leaveEndNum = timeStringToMinutes(leave.endTime);

        if (appointmentTimeNum >= leaveStartNum && appointmentTimeNum <= leaveEndNum) {
          return {
            available: false,
            reason: `Employee on leave ${leave.startTime}-${leave.endTime} - ${leave.reason}`
          };
        }
      }
    }
  }

  return { available: true };
};

const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getAvailableEmployees = (
  employees: Employee[],
  appointmentDate: Date,
  appointmentTime: string,
  holidays: Holiday[] = [],
  leaves: Leave[] = []
): Employee[] => {
  return employees.filter(employee => {
    const availability = checkAvailability(
      employee.id,
      appointmentDate,
      appointmentTime,
      holidays,
      leaves
    );
    return availability.available;
  });
};

export const suggestAlternativeTimes = (
  employeeId: number,
  appointmentDate: Date,
  holidays: Holiday[] = [],
  leaves: Leave[] = []
): string[] => {
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  return timeSlots.filter(time => {
    const availability = checkAvailability(
      employeeId,
      appointmentDate,
      time,
      holidays,
      leaves
    );
    return availability.available;
  });
};
