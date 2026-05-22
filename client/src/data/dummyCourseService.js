import {
    dummyCourses,
    dummyModules,
    dummyUserProgresses,
    dummySurvey,
} from "./dummyData.js";

const STORAGE_KEY = "modulex_dummy_data";
const CURRENT_USER_ID = "665000000000000000000002";

function createInitialData() {
    return {
        courses: dummyCourses,
        modules: dummyModules,
        userProgresses: dummyUserProgresses,
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

function mapCoursesForFrontend(data) {
    return data.courses.map((course, index) => {
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

export function getCourses() {
    const data = getData();

    return mapCoursesForFrontend(data);
}

export function getCourseById(courseId) {
    const courses = getCourses();

    return courses.find((course) => course.id === courseId);
}

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

    return mapCoursesForFrontend(data);
}

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

    return mapCoursesForFrontend(data);
}

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
                duration: module.duration || "",
                order: index + 1,
                materials: module.materials || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });
    }

    data.userProgresses.push({
        _id: makeId(),
        userId: CURRENT_USER_ID,
        courseId: course._id,
        completedModules: [],
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    saveData(data);

    return course;
}

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

export function deleteCourse(courseId) {
    const data = getData();

    data.courses = data.courses.filter((course) => course._id !== courseId);
    data.modules = data.modules.filter((module) => module.courseId !== courseId);
    data.userProgresses = data.userProgresses.filter(
        (progress) => progress.courseId !== courseId
    );

    saveData(data);

    return mapCoursesForFrontend(data);
}

export function getSurvey() {
    const data = getData();

    return data.survey;
}

export function resetDummyData() {
    const initialData = createInitialData();

    saveData(initialData);

    return initialData;
}


export function getCourseForAdmin(courseId) {
    const data = getData();

    const course = data.courses.find((item) => item._id === courseId);

    if (!course) {
        return null;
    }

    const modules = data.modules
        .filter((module) => module.courseId === courseId)
        .sort((a, b) => a.order - b.order);

    return {
        course,
        modules,
    };
}

export function updateCourseWithLessons(courseId, updatedCourse) {
    const data = getData();

    const course = data.courses.find((item) => item._id === courseId);

    if (!course) {
        return null;
    }

    course.title = updatedCourse.title;
    course.description = updatedCourse.description;
    course.updatedAt = new Date().toISOString();

    data.modules = data.modules.filter((module) => module.courseId !== courseId);

    updatedCourse.modules.forEach((lesson, index) => {
        data.modules.push({
            _id: lesson._id || makeId(),
            courseId,
            title: lesson.title,
            description: lesson.description || "",
            order: index + 1,
            duration: lesson.duration || "",
            materials: lesson.materials || [],
            createdAt: lesson.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    });

    saveData(data);

    return getCourseForAdmin(courseId);
}