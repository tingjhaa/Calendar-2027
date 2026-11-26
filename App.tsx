import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types & Constants ---
type TabType = 'calendar' | 'holidays' | 'notes';
type HolidayType = 'public' | 'special';
type HolidayFilter = 'all' | HolidayType;

interface TabItem {
  id: TabType;
  label: string;
}

interface FilterItem {
  id: HolidayFilter;
  label: string;
}

interface HolidayItem {
  date: string; // YYYY-MM-DD
  title: string;
  type: HolidayType;
}

interface AdventGift {
  no: string;
  name: string;
  note: string;
}

interface CalendarCell {
  day: number | null;
  dateKey: string | null;
}

const STORAGE_KEY = 'dior_atelier_calendar_notes_2027';

// วันปัจจุบันอ้างอิงตามบริบท (26 พฤศจิกายน 2026)
const TODAY_YEAR = 2026;
const TODAY_MONTH = 10; // 0-indexed (10 = พฤศจิกายน)
const TODAY_DAY = 26;
const TODAY_KEY = '2026-11-26';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const WEEKDAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
  'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
];

const HOLIDAYS: HolidayItem[] = [
  { date: '2026-11-26', title: 'Atelier Launch · 30 Avenue Montaigne', type: 'special' },
  { date: '2026-12-05', title: 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ', type: 'public' },
  { date: '2026-12-10', title: 'วันรัฐธรรมนูญ', type: 'public' },
  { date: '2026-12-25', title: 'Christmas Day · The Sweet Atelier', type: 'special' },
  { date: '2026-12-31', title: 'วันสิ้นปี (New Year’s Eve)', type: 'public' },
  { date: '2027-01-01', title: 'วันขึ้นปีใหม่ (New Year’s Day)', type: 'public' },
  { date: '2027-02-06', title: 'วันตรุษจีน (Chinese New Year)', type: 'special' },
  { date: '2027-02-14', title: 'วันวาเลนไทน์ (Valentine’s Day)', type: 'special' },
  { date: '2027-02-21', title: 'วันมาฆบูชา', type: 'public' },
  { date: '2027-03-08', title: 'วันสตรีสากล (International Women’s Day)', type: 'special' },
  { date: '2027-04-06', title: 'วันจักรี', type: 'public' },
  { date: '2027-04-13', title: 'วันสงกรานต์', type: 'public' },
  { date: '2027-04-14', title: 'วันสงกรานต์ / วันครอบครัว', type: 'public' },
  { date: '2027-04-15', title: 'วันสงกรานต์', type: 'public' },
  { date: '2027-05-01', title: 'วันแรงงานแห่งชาติ', type: 'public' },
  { date: '2027-05-04', title: 'วันฉัตรมงคล', type: 'public' },
  { date: '2027-05-20', title: 'วันวิสาขบูชา', type: 'public' },
  { date: '2027-06-03', title: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี', type: 'public' },
  { date: '2027-07-19', title: 'วันอาสาฬหบูชา', type: 'public' },
  { date: '2027-07-20', title: 'วันเข้าพรรษา', type: 'public' },
  { date: '2027-07-28', title: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว', type: 'public' },
  { date: '2027-08-12', title: 'วันเฉลิมพระชนมพรรษา พระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ', type: 'public' },
  { date: '2027-10-13', title: 'วันนวมินทรมหาราช', type: 'public' },
  { date: '2027-10-23', title: 'วันปิยมหาราช', type: 'public' },
  { date: '2027-12-05', title: 'วันพ่อแห่งชาติ', type: 'public' },
  { date: '2027-12-10', title: 'วันรัฐธรรมนูญ', type: 'public' },
  { date: '2027-12-25', title: 'Christmas Day · Holiday Edition', type: 'special' },
  { date: '2027-12-31', title: 'วันสิ้นปี', type: 'public' },
];

const FILTER_ITEMS: FilterItem[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'public', label: 'วันหยุดราชการ' },
  { id: 'special', label: 'วันสำคัญพิเศษ' },
];

const ADVENT_GIFTS: AdventGift[] = [
  { no: '01', name: 'J’adore L’Or Essence de Parfum', note: 'ความเปล่งประกายแห่งดอกไม้สีทองสำหรับเช้าวันใหม่' },
  { no: '02', name: 'Bois des Rêves Scented Candle', note: 'กลิ่นไม้หอมอบอุ่นและแสงเทียนแห่ง 30 Montaigne' },
  { no: '03', name: 'Miss Dior Blooming Bouquet', note: 'ความอ่อนโยนละมุนละไมในทุกก้าวที่เริ่มต้น' },
  { no: '04', name: 'Rouge Dior 999 Velvet', note: 'ความมั่นใจคลาสสิกเหนือกาลเวลา' },
  { no: '05', name: 'Dior Addict Lip Glow Oil', note: 'ความสดใสเปล่งปลั่งตลอดทั้งวัน' },
  { no: '06', name: 'Capture Totale Le Sérum', note: 'พลังแห่งการฟื้นบำรุงและความสมดุล' },
  { no: '07', name: 'Gris Dior Eau de Parfum', note: 'เสน่ห์ลึกลับสุขุมในโทนสีเทาอันเป็นเอกลักษณ์' },
  { no: '08', name: 'Dior Prestige La Micro-Huile de Rose', note: 'ความประณีตดุจกลีบกุหลาบกรองวิลล์' },
  { no: '09', name: 'Sauvage Eau de Parfum', note: 'ความอิสระและความคมชัดในทุกการตัดสินใจ' },
  { no: '10', name: 'Dior Vernis 999 Rouge', note: 'รายละเอียดเล็กๆ ที่เติมเต็มความสมบูรณ์แบบ' },
  { no: '11', name: 'Dior Délice Gingerbread Candle', note: 'ความอบอุ่นของซินนามอน น้ำผึ้ง และวานิลลา' },
  { no: '12', name: 'Étoile Dorée Atelier Charm', note: 'ดวงดาวนำทางแห่งความโชคดีของเมซง' },
];

// --- Helper Functions ---
const formatDateKey = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const parseDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
};

// --- Theme Tokens ---
const THEMES = {
  light: {
    bg: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    subtleCard: '#F7F6F2',
    textPrimary: '#1C1B1A',
    textSecondary: '#6E6A63',
    textMuted: '#9E9990',
    gold: '#C5A059',
    goldSoft: 'rgba(197, 160, 89, 0.14)',
    border: '#EAE6DF',
    sunday: '#B85D43',
    holiday: '#A67C37',
    selectedBg: '#1C1B1A',
    selectedText: '#FFFFFF',
  },
  dark: {
    bg: '#121110',
    surface: '#1A1816',
    card: '#1E1C1A',
    subtleCard: '#25221F',
    textPrimary: '#F5F2EB',
    textSecondary: '#B3ACA0',
    textMuted: '#787268',
    gold: '#D4B26A',
    goldSoft: 'rgba(212, 178, 106, 0.16)',
    border: '#2E2A25',
    sunday: '#E07A5F',
    holiday: '#E5C17B',
    selectedBg: '#D4B26A',
    selectedText: '#121110',
  },
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // ค่าเริ่มต้นเปิดที่เดือนมีนาคม 2027 ตามดีไซน์ต้นฉบับ
  const [viewYear, setViewYear] = useState(2027);
  const [viewMonth, setViewMonth] = useState(2); // 0-indexed (2 = มีนาคม)
  const [selectedDateKey, setSelectedDateKey] = useState('2027-03-01');

  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [draftNote, setDraftNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [holidayFilter, setHolidayFilter] = useState<HolidayFilter>('all');

  const theme = isDark ? THEMES.dark : THEMES.light;

  // โหลดบันทึกจาก AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setNotesMap(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed to load notes:', e);
      }
    })();
  }, []);

  // อัปเดตช่องแก้ไขโน้ตเมื่อเปลี่ยนวันที่เลือก
  useEffect(() => {
    setDraftNote(notesMap[selectedDateKey] || '');
    setIsEditingNote(false);
  }, [selectedDateKey, notesMap]);

  const saveNote = async () => {
    const trimmed = draftNote.trim();
    const updated = { ...notesMap };
    if (trimmed) {
      updated[selectedDateKey] = trimmed;
    } else {
      delete updated[selectedDateKey];
    }
    setNotesMap(updated);
    setIsEditingNote(false);
    setIsComposerOpen(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save note:', e);
    }
  };

  // เปิดตัวเขียนบันทึกแบบด่วนจากปุ่มมุมขวาบน
  const openNoteComposer = () => {
    setDraftNote(notesMap[selectedDateKey] || '');
    setIsEditingNote(false);
    setIsComposerOpen(true);
  };

  const closeNoteComposer = () => {
    setIsComposerOpen(false);
    setDraftNote(notesMap[selectedDateKey] || '');
  };

  // เปลี่ยนเดือน
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // ปุ่ม Today -> กระโดดไปวันที่ 26 พฤศจิกายน 2026
  const goToToday = () => {
    setViewYear(TODAY_YEAR);
    setViewMonth(TODAY_MONTH);
    setSelectedDateKey(TODAY_KEY);
    setActiveTab('calendar');
  };

  // สร้างตารางวันในเดือน
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateKey: formatDateKey(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // ข้อมูลวันที่กำลังเลือก
  const selectedInfo = useMemo(() => {
    const { year, month, day } = parseDateKey(selectedDateKey);
    const dateObj = new Date(year, month, day);
    const weekdayName = WEEKDAYS_FULL[dateObj.getDay()];
    const holiday = HOLIDAYS.find((h) => h.date === selectedDateKey);
    const gift = ADVENT_GIFTS[(day - 1) % ADVENT_GIFTS.length];
    return {
      year,
      month,
      day,
      thaiYear: year + 543,
      weekdayName,
      holiday,
      gift,
      savedNote: notesMap[selectedDateKey] || '',
    };
  }, [selectedDateKey, notesMap]);

  const filteredHolidays = useMemo(() => {
    if (holidayFilter === 'all') return HOLIDAYS;
    return HOLIDAYS.filter((h) => h.type === holidayFilter);
  }, [holidayFilter]);

  const allNoteEntries = useMemo(() => {
    return Object.entries(notesMap).sort(([a], [b]) => a.localeCompare(b));
  }, [notesMap]);

  const tabItems: TabItem[] = [
    { id: 'calendar', label: 'ปฏิทิน' },
    { id: 'holidays', label: 'วันสำคัญ' },
    { id: 'notes', label: `บันทึก (${allNoteEntries.length})` },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.cdClasp, { borderColor: theme.gold }]}>
            <Text style={[styles.cdText, { color: theme.gold }]}>CD</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              Calendar 2027 — The Sweet Atelier
            </Text>
            <Text
              style={[styles.appSubtitle, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              30 AVENUE MONTAIGNE · EDITION
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={openNoteComposer}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="เพิ่มบันทึกสำหรับวันที่เลือก"
            style={[
              styles.noteBtn,
              { borderColor: theme.gold, backgroundColor: theme.goldSoft },
            ]}
          >
            <View style={styles.noteIcon}>
              <View style={[styles.noteIconLine, { backgroundColor: theme.gold }]} />
              <View style={[styles.noteIconLine, { backgroundColor: theme.gold }]} />
              <View
                style={[
                  styles.noteIconLine,
                  styles.noteIconLineShort,
                  { backgroundColor: theme.gold },
                ]}
              />
            </View>
            <View
              style={[
                styles.noteBtnBadge,
                { backgroundColor: theme.gold, borderColor: theme.bg },
              ]}
            >
              <Text style={[styles.noteBtnBadgeText, { color: theme.bg }]}>+</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsDark(!isDark)}
            style={[
              styles.themeBtn,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.themeBtnText, { color: theme.textPrimary }]}>
              {isDark ? '☀ Porcelain' : '☾ Noir'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
        {tabItems.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabItem,
                active && { borderBottomColor: theme.gold, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.textPrimary : theme.textMuted },
                  active && { fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'calendar' && (
          <>
            {/* Month Card */}
            <View
              style={[
                styles.monthCard,
                { backgroundColor: theme.subtleCard, borderColor: theme.gold },
              ]}
            >
              <View style={styles.monthRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={[styles.navArrow, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Text style={[styles.navArrowText, { color: theme.textPrimary }]}>‹</Text>
                </TouchableOpacity>

                <View style={styles.monthCenter}>
                  <Text style={[styles.yearLabel, { color: theme.gold }]}>
                    {viewYear} · พ.ศ. {viewYear + 543}
                  </Text>
                  <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
                    {THAI_MONTHS[viewMonth]}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={[styles.navArrow, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Text style={[styles.navArrowText, { color: theme.textPrimary }]}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Today Pill Button */}
              <TouchableOpacity
                onPress={goToToday}
                style={[
                  styles.todayPill,
                  { borderColor: theme.gold, backgroundColor: theme.card },
                ]}
              >
                <Text style={[styles.todayPillText, { color: theme.textPrimary }]}>Today</Text>
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View
              style={[
                styles.gridCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {/* Weekday Header */}
              <View style={[styles.weekHeader, { borderBottomColor: theme.border }]}>
                {WEEKDAYS_SHORT.map((dayName, idx) => (
                  <View key={dayName} style={styles.weekCell}>
                    <Text
                      style={[
                        styles.weekText,
                        { color: idx === 0 ? theme.sunday : theme.textSecondary },
                      ]}
                    >
                      {dayName}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day Cells */}
              <View style={styles.daysWrap}>
                {calendarDays.map((cell: CalendarCell, index: number) => {
                  if (!cell.day || !cell.dateKey) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const isSelected = cell.dateKey === selectedDateKey;
                  const isToday = cell.dateKey === TODAY_KEY;
                  const isSunday = index % 7 === 0;
                  const holiday = HOLIDAYS.find((h) => h.date === cell.dateKey);
                  const hasNote = Boolean(notesMap[cell.dateKey]);

                  return (
                    <TouchableOpacity
                      key={cell.dateKey}
                      onPress={() => setSelectedDateKey(cell.dateKey!)}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.dayInner,
                          isSelected && { backgroundColor: theme.selectedBg },
                          !isSelected &&
                            isToday && { borderWidth: 1, borderColor: theme.gold },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            {
                              color: isSelected
                                ? theme.selectedText
                                : isSunday
                                ? theme.sunday
                                : holiday
                                ? theme.holiday
                                : theme.textPrimary,
                            },
                          ]}
                        >
                          {cell.day}
                        </Text>

                        {/* Indicator Dots */}
                        <View style={styles.dotRow}>
                          {holiday && (
                            <View
                              style={[
                                styles.dot,
                                {
                                  backgroundColor: isSelected
                                    ? theme.selectedText
                                    : theme.gold,
                                },
                              ]}
                            />
                          )}
                          {hasNote && (
                            <View
                              style={[
                                styles.dot,
                                {
                                  backgroundColor: isSelected
                                    ? theme.selectedText
                                    : theme.textPrimary,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Date Detail Card */}
            <View
              style={[
                styles.detailCard,
                { backgroundColor: theme.subtleCard, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.detailWeekday, { color: theme.gold }]}>
                {selectedInfo.weekdayName}
              </Text>
              <Text style={[styles.detailDate, { color: theme.textPrimary }]}>
                {selectedInfo.day} {THAI_MONTHS[selectedInfo.month]} {selectedInfo.year}
              </Text>
              <Text style={[styles.detailThaiYear, { color: theme.textSecondary }]}>
                พ.ศ. {selectedInfo.thaiYear}
              </Text>

              {selectedInfo.holiday && (
                <View
                  style={[
                    styles.holidayBadge,
                    { backgroundColor: theme.goldSoft, borderColor: theme.gold },
                  ]}
                >
                  <Text style={[styles.holidayBadgeText, { color: theme.textPrimary }]}>
                    ✦ {selectedInfo.holiday.title}
                  </Text>
                </View>
              )}

              {/* Dior Advent Drawer Inspiration */}
              <View
                style={[
                  styles.drawerBox,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.drawerTag, { color: theme.gold }]}>
                  DRAWER N° {selectedInfo.gift.no} · ATELIER NOTE
                </Text>
                <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>
                  {selectedInfo.gift.name}
                </Text>
                <Text style={[styles.drawerDesc, { color: theme.textSecondary }]}>
                  {selectedInfo.gift.note}
                </Text>
              </View>

              {/* Daily Memo Section */}
              <View
                style={[
                  styles.memoBox,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.memoHeader}>
                  <Text style={[styles.memoLabel, { color: theme.textSecondary }]}>
                    บันทึกส่วนตัวประจำวัน
                  </Text>
                  {!isEditingNote && (
                    <TouchableOpacity onPress={() => setIsEditingNote(true)}>
                      <Text style={[styles.editLink, { color: theme.gold }]}>
                        {selectedInfo.savedNote ? 'แก้ไข' : '+ เพิ่มบันทึก'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditingNote ? (
                  <View>
                    <TextInput
                      value={draftNote}
                      onChangeText={setDraftNote}
                      placeholder="พิมพ์นัดหมายหรือบันทึกสำคัญ..."
                      placeholderTextColor={theme.textMuted}
                      multiline
                      style={[
                        styles.noteInput,
                        {
                          color: theme.textPrimary,
                          borderColor: theme.gold,
                          backgroundColor: theme.surface,
                        },
                      ]}
                    />
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setDraftNote(selectedInfo.savedNote);
                          setIsEditingNote(false);
                        }}
                        style={[styles.cancelBtn, { borderColor: theme.border }]}
                      >
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>ยกเลิก</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveNote}
                        style={[styles.saveBtn, { backgroundColor: theme.gold }]}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
                          บันทึก
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.memoContent, { color: theme.textPrimary }]}>
                    {selectedInfo.savedNote || 'ยังไม่มีบันทึกสำหรับวันนี้'}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {activeTab === 'holidays' && (
          <View>
            <View style={styles.filterRow}>
              {FILTER_ITEMS.map((item) => {
                const active = holidayFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setHolidayFilter(item.id)}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: active ? theme.gold : theme.border,
                        backgroundColor: active ? theme.goldSoft : theme.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? theme.textPrimary : theme.textSecondary,
                        fontSize: 12,
                        fontWeight: active ? '600' : '400',
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredHolidays.map((item) => {
              const { year, month, day } = parseDateKey(item.date);
              return (
                <TouchableOpacity
                  key={item.date}
                  onPress={() => {
                    setViewYear(year);
                    setViewMonth(month);
                    setSelectedDateKey(item.date);
                    setActiveTab('calendar');
                  }}
                  style={[
                    styles.listCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.listDate, { color: theme.gold }]}>
                    {day} {THAI_MONTHS[month]} {year}
                  </Text>
                  <Text style={[styles.listTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'notes' && (
          <View>
            {allNoteEntries.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                  ยังไม่มีบันทึกในปฏิทิน เลือกวันที่ในหน้าปฏิทินเพื่อเพิ่มบันทึก
                </Text>
              </View>
            ) : (
              allNoteEntries.map(([dateKey, text]) => {
                const { year, month, day } = parseDateKey(dateKey);
                return (
                  <TouchableOpacity
                    key={dateKey}
                    onPress={() => {
                      setViewYear(year);
                      setViewMonth(month);
                      setSelectedDateKey(dateKey);
                      setActiveTab('calendar');
                    }}
                    style={[
                      styles.listCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.listDate, { color: theme.gold }]}>
                      {day} {THAI_MONTHS[month]} {year}
                    </Text>
                    <Text style={[styles.listTitle, { color: theme.textPrimary }]}>{text}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Note Composer Modal */}
      <Modal
        visible={isComposerOpen}
        transparent
        animationType="fade"
        onRequestClose={closeNoteComposer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeNoteComposer} />

          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.gold }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTag, { color: theme.gold }]}>ATELIER NOTE</Text>
              <TouchableOpacity
                onPress={closeNoteComposer}
                accessibilityRole="button"
                accessibilityLabel="ปิดหน้าต่างบันทึก"
                style={[styles.modalClose, { borderColor: theme.border }]}
              >
                <Text style={[styles.modalCloseText, { color: theme.textSecondary }]}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {selectedInfo.day} {THAI_MONTHS[selectedInfo.month]} {selectedInfo.year}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {selectedInfo.weekdayName} · เขียนบันทึกสำหรับวันนี้
            </Text>

            <TextInput
              value={draftNote}
              onChangeText={setDraftNote}
              placeholder="พิมพ์นัดหมายหรือบันทึกสำคัญ..."
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
              style={[
                styles.noteInput,
                styles.modalInput,
                {
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            />

            <View style={styles.noteActions}>
              <TouchableOpacity
                onPress={closeNoteComposer}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveNote}
                style={[styles.saveBtn, { backgroundColor: theme.gold }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cdClasp: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cdText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  appSubtitle: {
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: {
    alignItems: 'flex-start',
  },
  noteIconLine: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    marginBottom: 3,
  },
  noteIconLineShort: {
    width: 8,
    marginBottom: 0,
  },
  noteBtnBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBtnBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 17, 16, 0.55)',
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  modalClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    lineHeight: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 110,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 20,
    lineHeight: 22,
  },
  monthCenter: {
    alignItems: 'center',
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 2,
  },
  todayPill: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  todayPillText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  gridCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
  weekCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayInner: {
    width: 40,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
  },
  dotRow: {
    flexDirection: 'row',
    marginTop: 3,
    height: 5,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  detailWeekday: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  detailDate: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 2,
  },
  detailThaiYear: {
    fontSize: 13,
    marginTop: 2,
  },
  holidayBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  holidayBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  drawerBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  drawerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  drawerDesc: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  memoBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  editLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  memoContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 72,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  listCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  listDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
