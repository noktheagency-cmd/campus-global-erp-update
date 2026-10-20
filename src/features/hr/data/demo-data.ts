import type {
  HrAttendanceRecord,
  HrCandidateRecord,
  HrDepartmentPoint,
  HrEmployeeRecord,
  HrLeaveRequestRecord,
  HrPayrollItemRecord,
  HrPerformanceReviewRecord,
  HrVacancyRecord,
  HrWorkspaceData,
} from "@/features/hr/types";

type HrDemoPermissions = Pick<
  HrWorkspaceData,
  "canApproveLeave" | "canManage" | "canManageAttendance" | "canViewPayroll"
>;

const employeeSeeds = [
  ["Rəşad", "Məmmədov", "İT", "Baş İT meneceri", "HYBRID"],
  ["Aysel", "Həsənova", "Marketinq", "Marketinq meneceri", "ONSITE"],
  ["Tural", "Əlizadə", "Maliyyə", "Maliyyə analitiki", "ONSITE"],
  ["Nigar", "Məlikova", "Əməliyyat", "Əməliyyat mütəxəssisi", "HYBRID"],
  ["Anar", "Rzayev", "İnsan resursları", "HR mütəxəssisi", "ONSITE"],
  ["Sevinc", "Muradova", "Satış", "Satış nümayəndəsi", "REMOTE"],
  [
    "Fərid",
    "İsmayılov",
    "Müştəri xidmətləri",
    "Müştəri təcrübəsi mütəxəssisi",
    "ONSITE",
  ],
  ["Könül", "Abbasova", "Akademik işlər", "Akademik koordinator", "HYBRID"],
  ["Sabina", "Məmmədli", "Qəbul", "Qəbul məsləhətçisi", "ONSITE"],
  ["İlkin", "Hüseynli", "Qəbul", "Baş məsləhətçi", "HYBRID"],
  ["Nicat", "Mənsimov", "Satış", "Satış üzrə koordinator", "ONSITE"],
  ["İlhamə", "Quliyeva", "Marketinq", "Kontent mütəxəssisi", "REMOTE"],
  ["Arif", "Rüstəmov", "İT", "Frontend mühəndisi", "HYBRID"],
  ["Lalə", "Kərimova", "Maliyyə", "Mühasib", "ONSITE"],
  ["Elvin", "Qasımov", "Satış", "B2B menecer", "HYBRID"],
  ["Günel", "Babayeva", "Qəbul", "Sənəd koordinatoru", "ONSITE"],
  ["Vüqar", "Kərimov", "Əməliyyat", "Proses analitiki", "HYBRID"],
  ["Leyla", "Cəfərova", "Akademik işlər", "Proqram məsləhətçisi", "REMOTE"],
  ["Mina", "Abbasova", "Marketinq", "Dizayner", "HYBRID"],
  ["Orxan", "Yılmaz", "Qəbul", "Regional məsləhətçi", "ONSITE"],
  ["Nərgiz", "Abbasova", "İnsan resursları", "Talent mütəxəssisi", "ONSITE"],
  ["Murad", "Əliyev", "İT", "Sistem inzibatçısı", "HYBRID"],
  ["Aynur", "Qurbanova", "Maliyyə", "Ödənişlər üzrə mütəxəssis", "ONSITE"],
  ["Samir", "Vəliyev", "Əməliyyat", "Ofis meneceri", "ONSITE"],
] as const;

export function createHrDemoData(
  permissions: HrDemoPermissions,
): HrWorkspaceData {
  const employees = createEmployees(permissions.canViewPayroll);
  const attendance = createAttendance(employees);
  const leaveRequests = createLeaveRequests(employees);
  const vacancies = createVacancies(employees);
  const performanceReviews = createPerformanceReviews(employees);
  const payrollItems = createPayrollItems(employees);

  return {
    ...permissions,
    attendance,
    departments: createDepartments(employees),
    employees,
    employeeDepartments: [
      ...new Set(employees.map((employee) => employee.department)),
    ].sort(),
    employeeFilters: {
      department: "ALL",
      search: "",
      status: "ALL",
      workMode: "ALL",
    },
    employeePage: {
      page: 1,
      pageSize: employees.length,
      total: employees.length,
      totalPages: 1,
    },
    isPreview: true,
    leaveRequests,
    metrics: {
      activeEmployees: 22,
      attendanceRate: 86,
      employeesAtWorkToday: 19,
      employeesOnLeave: 2,
      openVacancies: 3,
      pendingLeaveRequests: 4,
      totalEmployees: 24,
    },
    payrollRuns: permissions.canViewPayroll
      ? [
          {
            approvedAt: "2026-08-01T10:30:00.000Z",
            approvedBy: "Tural Hüseynov",
            code: "PAY-2026-08",
            currency: "AZN",
            id: "hr_payroll_aug_2026",
            items: payrollItems,
            paidAt: "",
            periodEnd: "2026-08-31",
            periodStart: "2026-08-01",
            status: "APPROVED",
            totalBonus: payrollItems.reduce((sum, item) => sum + item.bonus, 0),
            totalDeductions: payrollItems.reduce(
              (sum, item) => sum + item.deductions,
              0,
            ),
            totalGross: payrollItems.reduce(
              (sum, item) => sum + item.baseSalary,
              0,
            ),
            totalNet: payrollItems.reduce(
              (sum, item) => sum + item.netSalary,
              0,
            ),
          },
        ]
      : [],
    selectedPayrollRunId: permissions.canViewPayroll
      ? "hr_payroll_aug_2026"
      : "",
    performanceReviews,
    trend: [
      { headcount: 18, joined: 2, label: "Sen 25", left: 1, month: "2025-09" },
      { headcount: 18, joined: 1, label: "Okt 25", left: 1, month: "2025-10" },
      { headcount: 19, joined: 2, label: "Noy 25", left: 0, month: "2025-11" },
      { headcount: 19, joined: 1, label: "Dek 25", left: 1, month: "2025-12" },
      { headcount: 20, joined: 2, label: "Yan 26", left: 1, month: "2026-01" },
      { headcount: 20, joined: 1, label: "Fev 26", left: 2, month: "2026-02" },
      { headcount: 21, joined: 2, label: "Mar 26", left: 1, month: "2026-03" },
      { headcount: 21, joined: 1, label: "Apr 26", left: 1, month: "2026-04" },
      { headcount: 22, joined: 2, label: "May 26", left: 0, month: "2026-05" },
      { headcount: 23, joined: 3, label: "İyn 26", left: 1, month: "2026-06" },
      { headcount: 23, joined: 1, label: "İyl 26", left: 1, month: "2026-07" },
      { headcount: 24, joined: 2, label: "Avq 26", left: 1, month: "2026-08" },
    ],
    upcomingEvents: [
      {
        date: "2026-08-08",
        detail: "Doğum günü",
        employeeId: employees[11].id,
        employeeName: employees[11].fullName,
        id: "event_birth_1",
        type: "BIRTHDAY",
      },
      {
        date: "2026-08-12",
        detail: "3 il tamam olur",
        employeeId: employees[12].id,
        employeeName: employees[12].fullName,
        id: "event_anniversary_1",
        type: "ANNIVERSARY",
      },
      {
        date: "2026-08-17",
        detail: "2 il tamam olur",
        employeeId: employees[5].id,
        employeeName: employees[5].fullName,
        id: "event_anniversary_2",
        type: "ANNIVERSARY",
      },
      {
        date: "2026-08-20",
        detail: "Müqavilə bitir",
        employeeId: employees[9].id,
        employeeName: employees[9].fullName,
        id: "event_contract_1",
        type: "CONTRACT_END",
      },
      {
        date: "2026-08-30",
        detail: "Müqavilə bitir",
        employeeId: employees[20].id,
        employeeName: employees[20].fullName,
        id: "event_contract_2",
        type: "CONTRACT_END",
      },
    ],
    vacancies,
  };
}

function createEmployees(canViewPayroll: boolean): HrEmployeeRecord[] {
  return employeeSeeds.map((seed, index) => {
    const [firstName, lastName, department, position, workMode] = seed;
    const employmentStatus =
      index === 18 || index === 19
        ? "ON_LEAVE"
        : index === 20 || index === 21
          ? "PROBATION"
          : "ACTIVE";
    const salary = 1400 + (index % 6) * 420 + (index < 5 ? 900 : 0);
    const usedLeaveDays = index % 5;

    return {
      address: index % 3 === 0 ? "Bakı, Nəsimi rayonu" : "Bakı şəhəri",
      annualLeaveAllowance: 21,
      attendanceSummary: {
        absent: index % 8 === 0 ? 1 : 0,
        late: index % 4,
        present: 18 - (index % 4),
        remote: workMode === "REMOTE" ? 5 : workMode === "HYBRID" ? 3 : 0,
        workDays: 21,
      },
      birthDate: `199${index % 8}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`,
      contractEndDate:
        index === 9 ? "2026-08-20" : index === 20 ? "2026-08-30" : "",
      currency: "AZN",
      department,
      email: `${slug(firstName)}.${slug(lastName)}@campus.az`,
      emergencyContactName: index % 2 === 0 ? `${firstName} ailə üzvü` : "",
      emergencyContactPhone: index % 2 === 0 ? `+994 55 98${index} 65 43` : "",
      emergencyContactRelation: index % 2 === 0 ? "Qohum" : "",
      employeeCode: `EMP-${String(128 - index).padStart(5, "0")}`,
      employmentStatus,
      employmentType:
        index === 20 ? "INTERN" : index === 23 ? "CONTRACT" : "FULL_TIME",
      firstName,
      fullName: `${firstName} ${lastName}`,
      hiredAt: `${2021 + (index % 5)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 20) + 1).padStart(2, "0")}`,
      id: `hr_demo_employee_${index + 1}`,
      lastName,
      managerId: index < 6 ? "" : `hr_demo_employee_${(index % 5) + 1}`,
      managerName:
        index < 6
          ? "Tural Hüseynov"
          : `${employeeSeeds[index % 5][0]} ${employeeSeeds[index % 5][1]}`,
      notes: "",
      office: workMode === "REMOTE" ? "Uzaqdan" : "Bakı ofisi",
      phone: `+994 ${index % 2 === 0 ? "50" : "55"} ${123 + index} ${45 + (index % 10)} ${String(67 + index).slice(-2)}`,
      position,
      remainingLeaveDays: 21 - usedLeaveDays,
      salary: canViewPayroll ? salary : null,
      terminatedAt: "",
      usedLeaveDays,
      workMode,
    };
  });
}

function createAttendance(employees: HrEmployeeRecord[]): HrAttendanceRecord[] {
  const activeEmployees = employees.filter(
    (employee) => employee.employmentStatus !== "ON_LEAVE",
  );

  return activeEmployees.map((employee, index) => {
    const status =
      index < 19
        ? index % 7 === 2
          ? "REMOTE"
          : index % 5 === 1
            ? "LATE"
            : "PRESENT"
        : index === 19
          ? "SICK_LEAVE"
          : "ABSENT";
    return {
      checkIn:
        status === "PRESENT"
          ? "09:00"
          : status === "LATE"
            ? `09:${String(10 + index).padStart(2, "0")}`
            : status === "REMOTE"
              ? "09:00"
              : "",
      checkOut: "",
      department: employee.department,
      employeeCode: employee.employeeCode,
      employeeId: employee.id,
      employeeName: employee.fullName,
      id: `hr_demo_attendance_${index + 1}`,
      note: status === "REMOTE" ? "Planlı uzaqdan iş günü" : "",
      position: employee.position,
      status,
      workDate: "2026-08-05",
    };
  });
}

function createLeaveRequests(
  employees: HrEmployeeRecord[],
): HrLeaveRequestRecord[] {
  const requests = [
    [8, "2026-08-10", "2026-08-14", 5, "ANNUAL", "PENDING"],
    [9, "2026-08-07", "2026-08-08", 2, "SICK", "PENDING"],
    [10, "2026-08-17", "2026-08-21", 5, "ANNUAL", "PENDING"],
    [7, "2026-08-24", "2026-08-26", 3, "STUDY", "PENDING"],
    [18, "2026-08-01", "2026-08-10", 7, "ANNUAL", "APPROVED"],
    [19, "2026-08-04", "2026-08-06", 3, "SICK", "APPROVED"],
    [2, "2026-07-06", "2026-07-10", 5, "ANNUAL", "APPROVED"],
  ] as const;

  return requests.map((item, index) => {
    const [employeeIndex, startDate, endDate, days, type, status] = item;
    const employee = employees[employeeIndex];
    return {
      code: `LEV-2026-${String(index + 1).padStart(4, "0")}`,
      createdAt: `2026-07-${String(20 + index).padStart(2, "0")}T09:00:00.000Z`,
      days,
      employeeCode: employee.employeeCode,
      employeeId: employee.id,
      employeeName: employee.fullName,
      endDate,
      id: `hr_demo_leave_${index + 1}`,
      reason: type === "SICK" ? "Həkim məsləhəti əsasında" : "Şəxsi plan",
      reviewNote: "",
      reviewedAt: status === "APPROVED" ? "2026-07-30T11:00:00.000Z" : "",
      reviewedBy: status === "APPROVED" ? "Anar Rzayev" : "",
      startDate,
      status,
      type,
    };
  });
}

function createVacancies(employees: HrEmployeeRecord[]): HrVacancyRecord[] {
  const vacancySeeds = [
    ["Senior qəbul məsləhətçisi", "Qəbul", "OPEN", 2],
    ["Performance marketinq mütəxəssisi", "Marketinq", "OPEN", 1],
    ["Backend mühəndisi", "İT", "OPEN", 1],
    ["Ofis administratoru", "Əməliyyat", "CLOSED", 1],
  ] as const;

  return vacancySeeds.map((seed, vacancyIndex) => {
    const [title, department, status, headcount] = seed;
    const candidates: HrCandidateRecord[] = Array.from(
      { length: vacancyIndex === 3 ? 1 : 3 },
      (_, candidateIndex) => ({
        appliedAt: `2026-07-${String(18 + vacancyIndex + candidateIndex).padStart(2, "0")}`,
        currency: "AZN",
        email: `namized.${vacancyIndex + 1}${candidateIndex + 1}@mail.az`,
        expectedSalary: 1800 + candidateIndex * 300,
        firstName: ["Ayan", "Kamal", "Röya"][candidateIndex] ?? "Ayan",
        fullName: `${["Ayan", "Kamal", "Röya"][candidateIndex] ?? "Ayan"} ${["Qasımova", "Səfərov", "Əliyeva"][candidateIndex] ?? "Qasımova"}`,
        id: `hr_demo_candidate_${vacancyIndex + 1}_${candidateIndex + 1}`,
        lastName:
          ["Qasımova", "Səfərov", "Əliyeva"][candidateIndex] ?? "Qasımova",
        nextInterviewAt: candidateIndex === 1 ? "2026-08-07T11:00:00.000Z" : "",
        notes: "",
        phone: `+994 55 300 2${vacancyIndex} ${candidateIndex}1`,
        rating: 3 + (candidateIndex % 3),
        source: candidateIndex === 0 ? "LinkedIn" : "Karyera portalı",
        stage:
          vacancyIndex === 3
            ? "HIRED"
            : candidateIndex === 0
              ? "SCREENING"
              : candidateIndex === 1
                ? "INTERVIEW"
                : "APPLIED",
        vacancyId: `hr_demo_vacancy_${vacancyIndex + 1}`,
      }),
    );
    return {
      candidateCount: candidates.length,
      candidates,
      closingDate: status === "OPEN" ? "2026-08-31" : "2026-07-31",
      code: `VAC-2026-${String(vacancyIndex + 1).padStart(3, "0")}`,
      department,
      description: `${department} komandası üçün təcrübəli və nəticəyönümlü komanda üzvü axtarılır.`,
      employmentType: "FULL_TIME",
      headcount,
      hiredCount: candidates.filter((candidate) => candidate.stage === "HIRED")
        .length,
      hiringManagerId: employees[vacancyIndex].id,
      hiringManagerName: employees[vacancyIndex].fullName,
      id: `hr_demo_vacancy_${vacancyIndex + 1}`,
      location: "Bakı",
      status,
      title,
      workMode: vacancyIndex === 2 ? "HYBRID" : "ONSITE",
    };
  });
}

function createPerformanceReviews(
  employees: HrEmployeeRecord[],
): HrPerformanceReviewRecord[] {
  return employees.slice(0, 8).map((employee, index) => ({
    completedAt: index < 5 ? "2026-07-25T14:00:00.000Z" : "",
    employeeId: employee.id,
    employeeName: employee.fullName,
    goals:
      "Növbəti dövrdə proses sürətini və komanda bilik paylaşımını artırmaq.",
    id: `hr_demo_review_${index + 1}`,
    improvements: "Prioritetləndirmə və hesabat intizamını gücləndirmək.",
    periodEnd: "2026-06-30",
    periodStart: "2026-01-01",
    reviewerId: employees[(index + 1) % 5].id,
    reviewerName: employees[(index + 1) % 5].fullName,
    score: index < 5 ? 3.6 + (index % 4) * 0.3 : null,
    status: index < 5 ? "COMPLETED" : index < 7 ? "IN_PROGRESS" : "DRAFT",
    strengths: "Məsuliyyət, komanda işi və müştəri yönümlülük.",
  }));
}

function createPayrollItems(
  employees: HrEmployeeRecord[],
): HrPayrollItemRecord[] {
  return employees
    .filter((employee) => employee.employmentStatus !== "ON_LEAVE")
    .map((employee, index) => {
      const baseSalary = employee.salary ?? 0;
      const bonus = index % 5 === 0 ? 250 : 0;
      const deductions = index % 7 === 0 ? 45 : 0;
      return {
        baseSalary,
        bonus,
        currency: employee.currency,
        deductions,
        employeeCode: employee.employeeCode,
        employeeId: employee.id,
        employeeName: employee.fullName,
        id: `hr_demo_payroll_item_${index + 1}`,
        netSalary: baseSalary + bonus - deductions,
        note: bonus > 0 ? "Aylıq nəticə bonusu" : "",
      };
    });
}

function createDepartments(employees: HrEmployeeRecord[]): HrDepartmentPoint[] {
  const colors = [
    "#0b66ff",
    "#17b26a",
    "#f79009",
    "#7a5af8",
    "#39a7d8",
    "#ee46bc",
  ];
  const counts = new Map<string, number>();
  employees.forEach((employee) =>
    counts.set(employee.department, (counts.get(employee.department) ?? 0) + 1),
  );

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, count], index) => ({
      color: colors[index],
      count,
      name,
      percentage: Math.round((count / employees.length) * 100),
    }));
}

function slug(value: string) {
  return value
    .toLocaleLowerCase("az-AZ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]/g, "");
}
