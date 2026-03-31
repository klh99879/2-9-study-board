import { CalendarEvent } from './types';

export const INITIAL_EVENTS: CalendarEvent[] = [
  // 1월
  { id: 'm1-1', title: '신정', date: '2026-01-01', category: 'schedule', isHoliday: true },
  
  // 2월
  { id: 'm2-16', title: '설날', date: '2026-02-16', category: 'schedule', isHoliday: true },
  { id: 'm2-17', title: '설날', date: '2026-02-17', category: 'schedule', isHoliday: true },
  { id: 'm2-18', title: '설날', date: '2026-02-18', category: 'schedule', isHoliday: true },

  // 3월
  { id: 'm3-1', title: '3.1절', date: '2026-03-01', category: 'schedule', isHoliday: true },
  { id: 'm3-2', title: '대체공휴일(3.1절)', date: '2026-03-02', category: 'schedule', isHoliday: true },
  { id: 'm3-3', title: '입학식 및 신입생 오리엔테이션', date: '2026-03-03', category: 'schedule' },
  { id: 'm3-4', title: '1학년 진단평가', date: '2026-03-04', category: 'exam' },
  { id: 'm3-10', title: '학교설명회 및 학부모총회', date: '2026-03-10', category: 'schedule' },
  { id: 'm3-24', title: '3월 전국연합학력평가', date: '2026-03-24', category: 'exam' },
  
  // 4월
  { id: 'm4-8', title: '1학기 학부모 상담주간', date: '2026-04-08', category: 'schedule' },
  { id: 'm4-29', title: '1학기 1회고사(중간고사)', date: '2026-04-29', category: 'exam' },
  { id: 'm4-30', title: '1학기 1회고사(중간고사)', date: '2026-04-30', category: 'exam' },
  
  // 5월
  { id: 'm5-1', title: '노동절', date: '2026-05-01', category: 'schedule', isHoliday: true },
  { id: 'm5-4', title: '1학기 1회고사(중간고사)', date: '2026-05-04', category: 'exam' },
  { id: 'm5-5', title: '어린이날', date: '2026-05-05', category: 'schedule', isHoliday: true },
  { id: 'm5-6', title: '1학기 1회고사(중간고사)', date: '2026-05-06', category: 'exam' },
  { id: 'm5-15', title: '스승의 날', date: '2026-05-15', category: 'schedule' },
  { id: 'm5-24', title: '부처님 오신 날', date: '2026-05-24', category: 'schedule', isHoliday: true },
  { id: 'm5-25', title: '대체공휴일(부처님 오신 날)', date: '2026-05-25', category: 'schedule', isHoliday: true },
  
  // 6월
  { id: 'm6-3', title: '제9회 전국동시지방선거일', date: '2026-06-03', category: 'schedule', isHoliday: true },
  { id: 'm6-4', title: '6월 전국연합학력평가', date: '2026-06-04', category: 'exam' },
  { id: 'm6-6', title: '현충일', date: '2026-06-06', category: 'schedule', isHoliday: true },
  
  // 7월
  { id: 'm7-1', title: '1학기 2회고사(기말고사)', date: '2026-07-01', category: 'exam' },
  { id: 'm7-2', title: '1학기 2회고사(기말고사)', date: '2026-07-02', category: 'exam' },
  { id: 'm7-3', title: '1학기 2회고사(기말고사)', date: '2026-07-03', category: 'exam' },
  { id: 'm7-6', title: '1학기 2회고사(기말고사)', date: '2026-07-06', category: 'exam' },
  { id: 'm7-16', title: '여름 방학식', date: '2026-07-16', category: 'schedule' },
  { id: 'm7-17', title: '제헌절', date: '2026-07-17', category: 'schedule' },
  
  // 8월
  { id: 'm8-15', title: '광복절', date: '2026-08-15', category: 'schedule', isHoliday: true },
  { id: 'm8-17', title: '대체공휴일(광복절)', date: '2026-08-17', category: 'schedule', isHoliday: true },
  { id: 'm8-18', title: '2학기 개학식', date: '2026-08-18', category: 'schedule' },

  // 9월
  { id: 'm9-2', title: '9월 수능모의평가', date: '2026-09-02', category: 'exam' },
  { id: 'm9-24', title: '추석', date: '2026-09-24', category: 'schedule', isHoliday: true },
  { id: 'm9-25', title: '추석', date: '2026-09-25', category: 'schedule', isHoliday: true },
  { id: 'm9-26', title: '추석', date: '2026-09-26', category: 'schedule', isHoliday: true },
  { id: 'm9-28', title: '대체공휴일(추석)', date: '2026-09-28', category: 'schedule', isHoliday: true },

  // 10월
  { id: 'm10-3', title: '개천절', date: '2026-10-03', category: 'schedule', isHoliday: true },
  { id: 'm10-5', title: '대체공휴일(개천절)', date: '2026-10-05', category: 'schedule', isHoliday: true },
  { id: 'm10-9', title: '한글날', date: '2026-10-09', category: 'schedule', isHoliday: true },
  { id: 'm10-13', title: '10월 전국연합학력평가', date: '2026-10-13', category: 'exam' },
  { id: 'm10-19', title: '2학기 1회고사(중간고사)', date: '2026-10-19', category: 'exam' },
  { id: 'm10-20', title: '2학기 1회고사(중간고사)', date: '2026-10-20', category: 'exam' },
  { id: 'm10-21', title: '2학기 1회고사(중간고사)', date: '2026-10-21', category: 'exam' },
  { id: 'm10-22', title: '2학기 1회고사(중간고사)', date: '2026-10-22', category: 'exam' },

  // 11월
  { id: 'm11-12', title: '대학수학능력시험(수능)', date: '2026-11-12', category: 'exam', isHoliday: true },
  { id: 'm11-13', title: '수능 다음날 재량휴업일', date: '2026-11-13', category: 'schedule', isHoliday: true },

  // 12월
  { id: 'm12-14', title: '2학기 2회고사(기말고사)', date: '2026-12-14', category: 'exam' },
  { id: 'm12-15', title: '2학기 2회고사(기말고사)', date: '2026-12-15', category: 'exam' },
  { id: 'm12-16', title: '2학기 2회고사(기말고사)', date: '2026-12-16', category: 'exam' },
  { id: 'm12-17', title: '2학기 2회고사(기말고사)', date: '2026-12-17', category: 'exam' },
  { id: 'm12-25', title: '성탄절', date: '2026-12-25', category: 'schedule', isHoliday: true },
  { id: 'm12-31', title: '겨울 방학식', date: '2026-12-31', category: 'schedule' },
];

export const INITIAL_EXAM_SCOPES = [
  { id: '1', subject: '국어', range: '교과서 10-50p, 프린트물 전체', date: '2026-04-29' },
  { id: '2', subject: '수학', range: '다항식의 연산 ~ 이차함수', date: '2026-04-29' },
  { id: '3', subject: '영어', range: 'Lesson 1, 2, 3과 본문 및 단어', date: '2026-04-30' }
];

export const INITIAL_ASSESSMENTS = [
  { id: '1', subject: '과학', title: '실험 보고서 작성', date: '2026-04-15', description: '물리 파트 실험 보고서 제출' },
  { id: '2', subject: '사회', title: '주제 탐구 발표', date: '2026-04-20', description: '지속 가능한 발전 관련 발표' }
];

export const INITIAL_ACTIVITIES = [
  { id: '1', title: '창체 동아리 활동', date: '2026-04-01', description: '동아리별 연간 계획 수립' },
  { id: '2', title: '진로 탐색 강연', date: '2026-04-10', description: '외부 전문가 초청 진로 특강' }
];
