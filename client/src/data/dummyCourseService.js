import {
    dummyPartners,
    dummyCourses,
    dummyModules,
    dummyUserProgresses,
    dummyCourseAssignments,
    dummySurvey,
} from "./dummyData.js";

const STORAGE_KEY = "modulex_dummy_data";
const CURRENT_USER_ID = "665000000000000000000002";

function createInitialData() {
    return {
        partners: dummyPartners,
        courses: dummyCourses,
        modules: dummyModules,
        userProgresses: dummyUserProgresses,
        courseAssignments: dummyCourseAssignments,
        survey: dummySurvey,
    };
}

function getData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        return JSON.parse(savedData);
    }

    const initialData = createInitialData();
    saveData(initialData);

    return initialData;
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId() {
    return crypto.randomUUID();
}

function mapCoursesForFrontend(data, coursesToMap = data.courses) {
    return coursesToMap.map((course, index) => {
        const progressData = data.userProgresses.find(
            (progress) =>
                progress.courseId === course._id &&
                progress.userId === CURRENT_USER_ID
        );

        const courseModules = data.modules
            .filter((module) => module.courseId === course._id)
            .sort((a, b) => a.order - b.order);

        const progress = progressData ? progressData.progress : 0;

        return {
            id: course._id,
            icon: index % 2 === 0 ? "▣" : "▤",
            title: course.title,
            description: course.description,
            progress,
            completed: progress >= 100,
            moduleCount: courseModules.length,
            modules: courseModules,
        };
    });
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  const response = await fetch("/api/courses");
  return await response.json();
*/
export function getCourses() {
    const data = getData();

    return mapCoursesForFrontend(data);
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  const response = await fetch(`/api/courses/${courseId}`);
  return await response.json();
*/
export function getCourseById(courseId) {
    const courses = getCourses();

    return courses.find((course) => course.id === courseId);
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  const response = await fetch("/api/admin/customers");
  return await response.json();
*/
export function getPartners() {
    const data = getData();

    return data.partners;
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch(`/api/admin/customers/${partnerId}/approve`, {
    method: "PATCH"
  });
*/
export function approvePartner(partnerId) {
    const data = getData();

    const partner = data.partners.find((item) => item.id === partnerId);

    if (!partner) {
        return null;
    }

    partner.status = "I gang";
    partner.statusClass = "active";
    partner.action = "Tildel kurser";

    saveData(data);

    return partner;
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch("/api/admin/assign-course", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      userId: partnerId,
      courseIds
    })
  });
*/
export function assignCoursesToPartner(partnerId, courseIds) {
    const data = getData();

    data.courseAssignments[partnerId] = courseIds;

    saveData(data);

    return data.courseAssignments[partnerId];
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  const response = await fetch(`/api/admin/customers/${partnerId}/courses`);
  return await response.json();
*/
export function getAssignedCoursesForPartner(partnerId) {
    const data = getData();

    return data.courseAssignments[partnerId] || [];
}

export function getAssignedCourseObjectsForPartner(partnerId) {
    const data = getData();

    const assignedCourseIds = data.courseAssignments[partnerId] || [];

    const assignedCourses = data.courses.filter((course) =>
        assignedCourseIds.includes(course._id)
    );

    return mapCoursesForFrontend(data, assignedCourses);
}

/*
  Bruges på partnerens dashboard.
  Lige nu er CURRENT_USER_ID hardcoded.
  Senere skal den komme fra login/auth.
*/
export function getCoursesForCurrentUser() {
    const data = getData();

    const assignedCourseIds = data.courseAssignments[CURRENT_USER_ID] || [];

    if (assignedCourseIds.length === 0) {
        return mapCoursesForFrontend(data);
    }

    const assignedCourses = data.courses.filter((course) =>
        assignedCourseIds.includes(course._id)
    );

    return mapCoursesForFrontend(data, assignedCourses);
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch(`/api/progress/courses/${courseId}/complete`, {
    method: "POST"
  });
*/
export function completeCourse(courseId) {
    const data = getData();

    const courseModules = data.modules.filter(
        (module) => module.courseId === courseId
    );

    const completedModuleIds = courseModules.map((module) => module._id);

    const existingProgress = data.userProgresses.find(
        (progress) =>
            progress.courseId === courseId &&
            progress.userId === CURRENT_USER_ID
    );

    if (existingProgress) {
        existingProgress.progress = 100;
        existingProgress.completedModules = completedModuleIds;
        existingProgress.updatedAt = new Date().toISOString();
    } else {
        data.userProgresses.push({
            _id: makeId(),
            userId: CURRENT_USER_ID,
            courseId,
            completedModules: completedModuleIds,
            progress: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveData(data);

    return getCoursesForCurrentUser();
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch(`/api/progress/courses/${courseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ progress })
  });
*/
export function updateCourseProgress(courseId, progressValue) {
    const data = getData();

    const progress = Math.max(0, Math.min(100, progressValue));

    const existingProgress = data.userProgresses.find(
        (item) =>
            item.courseId === courseId &&
            item.userId === CURRENT_USER_ID
    );

    if (existingProgress) {
        existingProgress.progress = progress;
        existingProgress.updatedAt = new Date().toISOString();
    } else {
        data.userProgresses.push({
            _id: makeId(),
            userId: CURRENT_USER_ID,
            courseId,
            completedModules: [],
            progress,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    saveData(data);

    return getCoursesForCurrentUser();
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch("/api/admin/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(newCourse)
  });
*/
export function createCourse(newCourse) {
    const data = getData();

    const course = {
        _id: makeId(),
        title: newCourse.title,
        description: newCourse.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    data.courses.push(course);

    if (newCourse.modules && newCourse.modules.length > 0) {
        newCourse.modules.forEach((module, index) => {
            data.modules.push({
                _id: makeId(),
                courseId: course._id,
                title: module.title,
                description: module.description || "",
                order: index + 1,
                materials: module.materials || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });
    }

    saveData(data);

    return course;
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch(`/api/admin/courses/${courseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedCourse)
  });
*/
export function updateCourse(courseId, updatedCourse) {
    const data = getData();

    const course = data.courses.find((item) => item._id === courseId);

    if (!course) {
        return null;
    }

    course.title = updatedCourse.title ?? course.title;
    course.description = updatedCourse.description ?? course.description;
    course.updatedAt = new Date().toISOString();

    saveData(data);

    return course;
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  await fetch(`/api/admin/courses/${courseId}`, {
    method: "DELETE"
  });
*/
export function deleteCourse(courseId) {
    const data = getData();

    data.courses = data.courses.filter((course) => course._id !== courseId);
    data.modules = data.modules.filter((module) => module.courseId !== courseId);

    data.userProgresses = data.userProgresses.filter(
        (progress) => progress.courseId !== courseId
    );

    Object.keys(data.courseAssignments).forEach((partnerId) => {
        data.courseAssignments[partnerId] = data.courseAssignments[
            partnerId
        ].filter((id) => id !== courseId);
    });

    saveData(data);

    return getCourses();
}

/*
  API SENERE:
  Denne metode kan senere erstattes med:

  const response = await fetch("/api/survey/questions");
  return await response.json();
*/
export function getSurvey() {
    const data = getData();

    return data.survey;
}

export function resetDummyData() {
    const initialData = createInitialData();

    saveData(initialData);

    return initialData;
}

/*
export function assignCoursesToPartner(partnerId, courseIds) {
    const data = getData();

    if (!data.courseAssignments) {
        data.courseAssignments = {};
    }

    data.courseAssignments[partnerId] = courseIds;

    saveData(data);

    return data.courseAssignments[partnerId];
}

export function getAssignedCoursesForPartner(partnerId) {
    const data = getData();

    if (!data.courseAssignments) {
        data.courseAssignments = {};
        saveData(data);
    }

    return data.courseAssignments[partnerId] || [];
}
*/