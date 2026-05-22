const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("modulex_token")
    );
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const url = `${API_URL}${path}`;

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers,
        });
    } catch (error) {
        console.error("API kunne ikke kontaktes:", {
            url,
            error,
        });

        throw new Error(
            `Kunne ikke få kontakt til backend på ${API_URL}. Tjek at serveren kører.`
        );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `API fejl: ${response.status}`);
    }

    return data;
}

export async function createAdminCourse(courseData) {
    const courseResponse = await apiFetch("/admin/courses", {
        method: "POST",
        body: JSON.stringify({
            title: courseData.title,
            description: courseData.description,
        }),
    });

    const course = courseResponse.course;
    const courseId = course._id;

    const modules = [];

    for (let index = 0; index < courseData.modules.length; index++) {
        const lesson = courseData.modules[index];

        const moduleResponse = await apiFetch(`/admin/courses/${courseId}/modules`, {
            method: "POST",
            body: JSON.stringify({
                title: lesson.title,
                description: lesson.description || "",
                order: index + 1,
                materials: lesson.materials || [],
            }),
        });

        modules.push(moduleResponse.module);
    }

    return {
        course,
        modules,
    };
}