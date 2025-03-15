// Tệp này chứa các định nghĩa locale tùy chỉnh cho tiếng Việt để sử dụng với date-fns
// Điều này giúp tránh các vấn đề với module resolution trên Snack.expo.dev

export const vi = {
  code: 'vi',
  formatDistance: {
    lessThanXSeconds: {
      one: 'chưa đến 1 giây',
      other: 'chưa đến {{count}} giây'
    },
    xSeconds: {
      one: '1 giây',
      other: '{{count}} giây'
    },
    halfAMinute: 'nửa phút',
    lessThanXMinutes: {
      one: 'chưa đến 1 phút',
      other: 'chưa đến {{count}} phút'
    },
    xMinutes: {
      one: '1 phút',
      other: '{{count}} phút'
    },
    aboutXHours: {
      one: 'khoảng 1 giờ',
      other: 'khoảng {{count}} giờ'
    },
    xHours: {
      one: '1 giờ',
      other: '{{count}} giờ'
    },
    xDays: {
      one: '1 ngày',
      other: '{{count}} ngày'
    },
    aboutXWeeks: {
      one: 'khoảng 1 tuần',
      other: 'khoảng {{count}} tuần'
    },
    xWeeks: {
      one: '1 tuần',
      other: '{{count}} tuần'
    },
    aboutXMonths: {
      one: 'khoảng 1 tháng',
      other: 'khoảng {{count}} tháng'
    },
    xMonths: {
      one: '1 tháng',
      other: '{{count}} tháng'
    },
    aboutXYears: {
      one: 'khoảng 1 năm',
      other: 'khoảng {{count}} năm'
    },
    xYears: {
      one: '1 năm',
      other: '{{count}} năm'
    },
    overXYears: {
      one: 'hơn 1 năm',
      other: 'hơn {{count}} năm'
    },
    almostXYears: {
      one: 'gần 1 năm',
      other: 'gần {{count}} năm'
    }
  },
  formatLong: {
    date: function (options) {
      return 'dd/MM/yyyy';
    },
    time: function (options) {
      return 'HH:mm';
    },
    dateTime: function (options) {
      return 'dd/MM/yyyy HH:mm';
    }
  },
  formatRelative: function (token) {
    const formatRelativeTokens = {
      lastWeek: "'hôm' eeee 'tuần trước vào lúc' p",
      yesterday: "'hôm qua vào lúc' p",
      today: "'hôm nay vào lúc' p",
      tomorrow: "'ngày mai vào lúc' p",
      nextWeek: "eeee 'vào lúc' p",
      other: 'P'
    };
    return formatRelativeTokens[token];
  },
  localize: {
    ordinalNumber: function (number) {
      return number.toString();
    },
    era: function (width) {
      return {
        narrow: ['TCN', 'SCN'],
        short: ['trước CN', 'sau CN'],
        long: ['trước Công Nguyên', 'sau Công Nguyên']
      }[width];
    },
    quarter: function (quarter, width) {
      const quarters = {
        narrow: ['1', '2', '3', '4'],
        short: ['Q1', 'Q2', 'Q3', 'Q4'],
        long: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4']
      };
      return quarters[width][quarter - 1];
    },
    month: function (month, width) {
      const months = {
        narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        short: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
        long: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
      };
      return months[width][month];
    },
    day: function (day, width) {
      const days = {
        narrow: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        short: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        abbreviated: ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'],
        long: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
      };
      return days[width][day];
    },
    dayPeriod: function (dayPeriod, width) {
      const dayPeriods = {
        narrow: {
          am: 'AM',
          pm: 'PM',
          midnight: 'nửa đêm',
          noon: 'trưa',
          morning: 'sáng',
          afternoon: 'chiều',
          evening: 'tối',
          night: 'đêm'
        },
        abbreviated: {
          am: 'AM',
          pm: 'PM',
          midnight: 'nửa đêm',
          noon: 'trưa',
          morning: 'sáng',
          afternoon: 'chiều',
          evening: 'tối',
          night: 'đêm'
        },
        long: {
          am: 'AM',
          pm: 'PM',
          midnight: 'nửa đêm',
          noon: 'trưa',
          morning: 'sáng',
          afternoon: 'chiều',
          evening: 'tối',
          night: 'đêm'
        }
      };
      return dayPeriods[width][dayPeriod];
    }
  },
  match: {
    ordinalNumber: /^(\d+)/i,
    era: function (width) {
      return {
        narrow: /^(tcn|scn)/i,
        short: /^(trước CN|sau CN)/i,
        long: /^(trước Công Nguyên|sau Công Nguyên)/i
      }[width];
    },
    quarter: function (width) {
      return {
        narrow: /^[1234]/i,
        short: /^q[1234]/i,
        long: /^quý [1234]/i
      }[width];
    },
    month: function (width) {
      return {
        narrow: /^[123456789]|10|11|12/i,
        short: /^th[123456789]|th10|th11|th12/i,
        long: /^tháng [123456789]|tháng 10|tháng 11|tháng 12/i
      }[width];
    },
    day: function (width) {
      return {
        narrow: /^(cn|[t][2-7])/i,
        short: /^(cn|[t][2-7])/i,
        abbreviated: /^(cn|th[2-7])/i,
        long: /^(chủ nhật|thứ [hai|ba|tư|năm|sáu|bảy])/i
      }[width];
    },
    dayPeriod: function (width) {
      return {
        any: /^(am|pm|nửa đêm|trưa|(buổi) (sáng|chiều|tối|đêm))/i
      }[width];
    }
  },
  options: {
    weekStartsOn: 1, // Tuần bắt đầu từ thứ Hai
    firstWeekContainsDate: 1 // Tuần đầu tiên của năm phải chứa ngày 1/1
  }
};
