export type Category = 'schedule' | 'exam' | 'assessment' | 'activity';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  category: Category;
  description?: string;
  isHoliday?: boolean;
  color?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
  imageUrl?: string;
}

export interface ExamScope {
  id: string;
  subject: string;
  range: string;
  date: string;
  imageUrl?: string;
}

export interface Assessment {
  id: string;
  subject: string;
  title: string;
  date: string;
  description?: string;
  imageUrl?: string;
}

export interface StudentActivity {
  id: string;
  title: string;
  date: string;
  description?: string;
  imageUrl?: string;
}
