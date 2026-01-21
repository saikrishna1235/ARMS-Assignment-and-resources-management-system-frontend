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

    // Basic auth guard
    if (isLogged !== "true" || role !== "student" || !userId) {
        window.location.href = "login.html";
        return;
    }

    // header info
    const header = document.querySelector(".sap-header span");
    header.textContent = `ARMS | Student Dashboard – ${username}`;

    // sidebar navigation
    document.querySelectorAll(".sap-tree button").forEach(btn => {
        btn.addEventListener("click", () => {
            const sec = btn.dataset.sec;
            switchSection(sec);

            if (sec === "materials") {
                const sel = document.getElementById("stuMaterialCourseSelect");
                if (sel && sel.value) loadMaterials(sel.value);
            }
            if (sec === "assignments") {
                const sel = document.getElementById("stuAssignCourseSelect");
                if (sel && sel.value) loadAssignments(sel.value);
            }
            if (sec === "marks") {
                loadMarks(userId);
            }
        });
    });

    // logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.clear();
        history.replaceState({}, "", "login.html");
        window.location.href = "login.html";
    });

    // selectors
    document.getElementById("stuMaterialCourseSelect").addEventListener("change", e => {
        if (e.target.value) loadMaterials(e.target.value);
    });

    document.getElementById("stuAssignCourseSelect").addEventListener("change", e => {
        if (e.target.value) loadAssignments(e.target.value);
    });

    // submit assignment
    document.getElementById("btnSaveSubmission").addEventListener("click", saveSubmission);

    // initial data
    loadProfile(userId);
    loadCourses(userId);
});

// ====== PROFILE ======
function loadProfile(userId) {
    fetch(`${API_BASE}/student/profile?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("stuProfileContainer");
            box.innerHTML = `
                <div class="mb-2"><strong>Name:</strong> ${data.full_name || "-"}</div>
                <div class="mb-2"><strong>Email:</strong> ${data.email || "-"}</div>
                <div class="mb-2"><strong>Username:</strong> ${data.username || "-"}</div>
            `;
        });
}

// ====== COURSES ======
function loadCourses(userId) {
    fetch(`${API_BASE}/student/courses?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(list => {
            stuCoursesCache = list || [];

            // dashboard cards
            const container = document.getElementById("stuCourseList");
            container.innerHTML = "";
            stuCoursesCache.forEach(c => {
                const col = document.createElement("div");
                col.className = "col-12 col-md-6 col-lg-4";
                col.innerHTML = `
                    <div class="sap-course-card">
                        <div class="sap-course-title">${c.course_name}</div>
                        <div class="small text-muted">Status: ${c.status}</div>
                    </div>
                `;
                container.appendChild(col);
            });

            // dropdowns
            fillCourseSelect("stuMaterialCourseSelect");
            fillCourseSelect("stuAssignCourseSelect");

            // defaults
            if (stuCoursesCache.length > 0) {
                const firstId = stuCoursesCache[0].course_id;
                document.getElementById("stuMaterialCourseSelect").value = firstId;
                document.getElementById("stuAssignCourseSelect").value    = firstId;
                loadMaterials(firstId);
                loadAssignments(firstId);
            }
        });
}

function fillCourseSelect(selectId) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = "";
    stuCoursesCache.forEach(c => {
        sel.innerHTML += `<option value="${c.course_id}">${c.course_name}</option>`;
    });
}

// ====== MATERIALS ======
function loadMaterials(courseId) {
    const cid = courseId || document.getElementById("stuMaterialCourseSelect").value;
    if (!cid) return;

    fetch(`${API_BASE}/student/course/${cid}/materials`)
        .then(r => r.json())
        .then(rows => {
            const tbody = document.getElementById("stuMaterialTable");
            tbody.innerHTML = "";

            (rows || []).forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td>${row.title}</td>
                        <td>${row.file_type ? row.file_type.toUpperCase() : "-"}</td>
                        <td>${row.uploaded_at || "-"}</td>
                        <td>
                            <a href="${API_BASE}/${row.file_path}" 
                               target="_blank" 
                               class="btn btn-sm btn-primary">
                                View
                            </a>
                        </td>
                    </tr>
                `;
            });
        });
}

// ====== ASSIGNMENTS ======
function loadAssignments(courseId) {
    const cid = courseId || document.getElementById("stuAssignCourseSelect").value;
    const studentId = sessionStorage.getItem("userId");
    if (!cid) return;

    fetch(`${API_BASE}/student/course/${cid}/assignments?studentId=${encodeURIComponent(studentId)}`)
        .then(r => r.json())
        .then(list => {
            const tbody = document.getElementById("stuAssignTable");
            tbody.innerHTML = "";

            (list || []).forEach(a => {
                const status = a.submitted_at ? "Submitted" : "Pending";
                const marks  = a.marks != null ? a.marks : "-";

                const viewAssignmentLink = a.file_path
                    ? `<a class="btn btn-sm btn-primary me-1" href="${API_BASE}/${a.file_path}" target="_blank">View</a>`
                    : `<button class="btn btn-sm btn-secondary me-1" disabled>No File</button>`;

                const viewSubmissionBtn = a.submission_file_path
                    ? `<a class="btn btn-sm btn-outline-primary me-1" href="${API_BASE}/${a.submission_file_path}" target="_blank">My Submission</a>`
                    : "";

                const deleteSubmissionBtn = a.submission_id
                    ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteSubmission(${a.submission_id})">Delete</button>`
                    : "";

                tbody.innerHTML += `
                    <tr>
                        <td>${a.title}</td>
                        <td>${a.due_date || "-"}</td>
                        <td>${a.created_at || "-"}</td>
                        <td>${status}</td>
                        <td>${marks}</td>
                        <td>
                            ${viewAssignmentLink}
                            <button class="btn btn-sm btn-secondary me-1"
                                onclick="openSubmitModal(${a.assignment_id}, '${a.title.replace(/'/g, "\\'")}')">
                                Upload
                            </button>
                            ${viewSubmissionBtn}
                            ${deleteSubmissionBtn}
                        </td>
                    </tr>
                `;
            });
        });
}

// open submit modal
function openSubmitModal(assignmentId, title) {
    document.getElementById("stuSubmitAssignmentId").value = assignmentId;
    document.getElementById("stuSubmitFileInput").value = "";
    document.getElementById("submitModalTitle").innerText = `Submit: ${title}`;
    new bootstrap.Modal(document.getElementById("modalSubmitAssignment")).show();
}

// submit upload
function saveSubmission() {
    const studentId   = sessionStorage.getItem("studentId");
    const assignmentId = document.getElementById("stuSubmitAssignmentId").value;
    const file        = document.getElementById("stuSubmitFileInput").files[0];

    if (!assignmentId || !file) {
        showToast("Please choose a file to upload.");
        return;
    }

    const fd = new FormData();
    fd.append("file", file);           // multer.single("file")
    fd.append("student_id", studentId);
    fd.append("assignment_id", assignmentId);

    fetch(`${API_BASE}/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: fd
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Submission uploaded");
            const cid = document.getElementById("stuAssignCourseSelect").value;
            loadAssignments(cid);
            bootstrap.Modal.getInstance(document.getElementById("modalSubmitAssignment")).hide();
        } else {
            showToast(res.message || "Upload failed");
        }
    });
}

// delete submission
function deleteSubmission(submissionId) {
    if (!confirm("Delete your submission?")) return;

    fetch(`${API_BASE}/student/submissions/${submissionId}`, {
        method: "DELETE"
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Submission deleted");
            const cid = document.getElementById("stuAssignCourseSelect").value;
            loadAssignments(cid);
        } else {
            showToast(res.message || "Delete failed");
        }
    });
}

// ====== MARKS ======
function loadMarks(studentId) {
    fetch(`${API_BASE}/student/marks?studentId=${encodeURIComponent(studentId)}`)
        .then(r => r.json())
        .then(list => {
            const tbody = document.getElementById("stuMarksTable");
            tbody.innerHTML = "";

            (list || []).forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td>${row.course_name}</td>
                        <td>${row.assignment_title}</td>
                        <td>${row.marks != null ? row.marks : "-"}</td>
                        <td>${row.submitted_at || "-"}</td>
                    </tr>
                `;
            });
        });
}
document.getElementById("btnChangePassword").addEventListener("click", () => {
    const userId = sessionStorage.getItem("userId");

    const oldP = document.getElementById("oldPass").value.trim();
    const newP = document.getElementById("newPass").value.trim();
    const conP = document.getElementById("confirmPass").value.trim();

    if (!oldP || !newP || !conP)
        return showToast("All fields required");

    if (newP !== conP)
        return showToast("New & Confirm passwords do not match");

    fetch(`${API_BASE}/student/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, oldPassword: oldP, newPassword: newP })
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message);

        if (res.status === "success") {
            document.getElementById("oldPass").value = "";
            document.getElementById("newPass").value = "";
            document.getElementById("confirmPass").value = "";
        }
    });
});


