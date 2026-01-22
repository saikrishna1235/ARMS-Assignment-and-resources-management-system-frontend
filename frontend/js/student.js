// frontend/js/student.js
const API_BASE_URL = "https://arms-assignment-and-resources-management-system.up.railway.app";

let stuCoursesCache = [];

// ====== UTILITIES ======
function showToast(msg) {
    const body = document.getElementById("studentToastMsg");
    body.innerText = msg;
    const t = new bootstrap.Toast(document.getElementById("studentToast"));
    t.show();
}

function switchSection(secId) {
    ["dashboard", "materials", "assignments", "marks", "profile"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("d-none", id !== secId);
    });

    document.querySelectorAll(".sap-tree button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.sec === secId);
    });
}

// ====== MAIN INIT ======
document.addEventListener("DOMContentLoaded", () => {
    const isLogged = sessionStorage.getItem("isLoggedIn");
    const role     = sessionStorage.getItem("role");
    const userId   = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username");

    if (isLogged !== "true" || role !== "student" || !userId) {
        window.location.href = "login.html";
        return;
    }

    document.querySelector(".sap-header span").textContent =
        `ARMS | Student Dashboard – ${username}`;

    document.querySelectorAll(".sap-tree button").forEach(btn => {
        btn.addEventListener("click", () => {
            const sec = btn.dataset.sec;
            switchSection(sec);

            if (sec === "materials") {
                const sel = document.getElementById("stuMaterialCourseSelect");
                if (sel?.value) loadMaterials(sel.value);
            }
            if (sec === "assignments") {
                const sel = document.getElementById("stuAssignCourseSelect");
                if (sel?.value) loadAssignments(sel.value);
            }
            if (sec === "marks") loadMarks(userId);
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    document.getElementById("stuMaterialCourseSelect")
        .addEventListener("change", e => e.target.value && loadMaterials(e.target.value));

    document.getElementById("stuAssignCourseSelect")
        .addEventListener("change", e => e.target.value && loadAssignments(e.target.value));

    document.getElementById("btnSaveSubmission")
        .addEventListener("click", saveSubmission);

    loadProfile(userId);
    loadCourses(userId);
});

// ====== PROFILE ======
function loadProfile(userId) {
    fetch(`${API_BASE_URL}/student/profile?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(data => {
            document.getElementById("stuProfileContainer").innerHTML = `
                <div><strong>Name:</strong> ${data.full_name || "-"}</div>
                <div><strong>Email:</strong> ${data.email || "-"}</div>
                <div><strong>Username:</strong> ${data.username || "-"}</div>
            `;
        })
        .catch(() => showToast("Failed to load profile"));
}

// ====== COURSES ======
function loadCourses(userId) {
    fetch(`${API_BASE_URL}/student/courses?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(list => {
            stuCoursesCache = list || [];

            const container = document.getElementById("stuCourseList");
            container.innerHTML = "";

            stuCoursesCache.forEach(c => {
                container.innerHTML += `
                    <div class="col-md-4">
                        <div class="sap-course-card">
                            <div class="sap-course-title">${c.course_name}</div>
                            <div class="small text-muted">Status: ${c.status}</div>
                        </div>
                    </div>`;
            });

            fillCourseSelect("stuMaterialCourseSelect");
            fillCourseSelect("stuAssignCourseSelect");

            if (stuCoursesCache.length) {
                const id = stuCoursesCache[0].course_id;
                document.getElementById("stuMaterialCourseSelect").value = id;
                document.getElementById("stuAssignCourseSelect").value = id;
                loadMaterials(id);
                loadAssignments(id);
            }
        })
        .catch(() => showToast("Failed to load courses"));
}

function fillCourseSelect(id) {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    stuCoursesCache.forEach(c =>
        sel.innerHTML += `<option value="${c.course_id}">${c.course_name}</option>`
    );
}

// ====== MATERIALS ======
function loadMaterials(courseId) {
    fetch(`${API_BASE_URL}/student/course/${courseId}/materials`)
        .then(r => r.json())
        .then(rows => {
            const tbody = document.getElementById("stuMaterialTable");
            tbody.innerHTML = "";
            rows.forEach(r => {
                tbody.innerHTML += `
                    <tr>
                        <td>${r.title}</td>
                        <td>${r.file_type || "-"}</td>
                        <td>${r.uploaded_at || "-"}</td>
                        <td><a href="${API_BASE_URL}/${r.file_path}" target="_blank">View</a></td>
                    </tr>`;
            });
        })
        .catch(() => showToast("Failed to load materials"));
}

// ====== ASSIGNMENTS ======
function loadAssignments(courseId) {
    const studentId = sessionStorage.getItem("userId");

    fetch(`${API_BASE_URL}/student/course/${courseId}/assignments?studentId=${studentId}`)
        .then(r => r.json())
        .then(list => {
            const tbody = document.getElementById("stuAssignTable");
            tbody.innerHTML = "";
            list.forEach(a => {
                tbody.innerH
