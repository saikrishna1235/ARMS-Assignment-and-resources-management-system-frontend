// frontend/js/teacher.js
const API_BASE_URL = "https://arms-assignment-and-resources-management-system.up.railway.app";

const API_BASE = "http://localhost:5000";

// cache
let coursesCache = [];
let studentsCache = [];  
// ====== UTILITIES ======
function showToast(msg) {
    const body = document.getElementById("teacherToastMsg");
    body.innerText = msg;
    const t = new bootstrap.Toast(document.getElementById("teacherToast"));
    t.show();
}

function switchSection(secId) {
    // hide/show sections
    ["dashboard", "materials", "assignments", "enrollments", "profile"].forEach(id => {
        document.getElementById(id).classList.toggle("d-none", id !== secId);
    });

    // When entering Materials tab
    if (secId === "materials") {
        const sel = document.getElementById("materialCourseSelect");
        if (sel && sel.value) loadMaterials(sel.value);
    }

    // When entering Assignments tab
    if (secId === "assignments") {
        const sel = document.getElementById("assignCourseSelect");
        if (sel && sel.value) loadAssignments(sel.value);
    }

    // ✅ When entering Enrollment tab
    if (secId === "enrollments") {
        ensureEnrollmentData();
    }
}


// ====== MAIN INIT ======
document.addEventListener("DOMContentLoaded", () => {
    const isLogged = sessionStorage.getItem("isLoggedIn");
    const role     = sessionStorage.getItem("role");
    const userId   = sessionStorage.getItem("userId");
    const username = sessionStorage.getItem("username");

    // Avoid redirect loops: wait for sessionStorage to actually load
setTimeout(() => {

    const isLogged = sessionStorage.getItem("isLoggedIn");
    const role     = sessionStorage.getItem("role");
    const userId   = sessionStorage.getItem("userId");

    if (!isLogged || role !== "teacher" || !userId) {
        console.warn("Teacher not logged in. Redirecting...");
        window.location.href = "login.html";
        return;
    }

}, 50);


    // header info
    const header = document.querySelector(".sap-header span");
    header.textContent = `ARMS | Teacher Dashboard – ${username}`;

    // sidebar navigation
document.querySelectorAll(".sap-tree button").forEach(btn => {
    btn.addEventListener("click", () => {
        // highlight active
        document.querySelectorAll(".sap-tree button")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        // switch page
        const sec = btn.getAttribute("data-sec");
        switchSection(sec);   // ✅ CRITICAL — YOU WERE NOT CALLING THIS
    });
});



    // logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.clear();
        history.replaceState({}, "", "login.html");
        window.location.href = "login.html";
    });

    // Add material
   document.getElementById("btnAddMaterial").addEventListener("click", () => {
    fillCourseSelect("matCourseInput");
    document.getElementById("matTitleInput").value = "";
    document.getElementById("matFileInput").value = "";   // ✅ correct file input
    document.getElementById("matTypeInput").value = "pdf";
    new bootstrap.Modal(document.getElementById("modalMaterial")).show();
});


    document.getElementById("btnSaveMaterial").addEventListener("click", saveMaterial);

    // Add assignment
    document.getElementById("btnAddAssignment").addEventListener("click", () => {
        fillCourseSelect("assCourseInput");
        document.getElementById("assTitleInput").value = "";
        document.getElementById("assDescInput").value = "";
        document.getElementById("assDueInput").value = "";
        new bootstrap.Modal(document.getElementById("modalAssignment")).show();
    });

    document.getElementById("btnSaveAssignment").addEventListener("click", saveAssignment);

    // react to course selection
    document.getElementById("materialCourseSelect").addEventListener("change", e => {
        if (e.target.value) loadMaterials(e.target.value);
    });

    document.getElementById("assignCourseSelect").addEventListener("change", e => {
        if (e.target.value) loadAssignments(e.target.value);
    });

    // initial data
    loadProfile(userId);
    loadCourses(userId);
});

// ====== PROFILE ======
function loadProfile(userId) {
    fetch(`${API_BASE}/teacher/profile?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("profileContainer");
            box.innerHTML = `
                <div class="mb-2"><strong>Name:</strong> ${data.full_name || "-"}</div>
                <div class="mb-2"><strong>Email:</strong> ${data.email || "-"}</div>
                <div class="mb-2"><strong>Username:</strong> ${data.username || "-"}</div>
            `;
        });
}

// ====== COURSES ======
function loadCourses(userId) {
    fetch(`${API_BASE}/teacher/courses?userId=${encodeURIComponent(userId)}`)
        .then(r => r.json())
        .then(list => {
            coursesCache = list || [];

            // dashboard cards
            const container = document.getElementById("courseList");
            container.innerHTML = "";
            coursesCache.forEach(c => {
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
            fillCourseSelect("materialCourseSelect");
            fillCourseSelect("assignCourseSelect");
            fillCourseSelect("enrollCourseSelect");

            // default selections
            if (coursesCache.length > 0) {
                document.getElementById("materialCourseSelect").value = coursesCache[0].course_id;
                loadMaterials(coursesCache[0].course_id);

                document.getElementById("assignCourseSelect").value = coursesCache[0].course_id;
                loadAssignments(coursesCache[0].course_id);
            }
        });
}

function fillCourseSelect(selectId) {
    const sel = document.getElementById(selectId);
    sel.innerHTML = "";
    coursesCache.forEach(c => {
        sel.innerHTML += `<option value="${c.course_id}">${c.course_name}</option>`;
    });
}

// ====== MATERIALS ======
function loadMaterials(courseId) {
    const cid = courseId || document.getElementById("materialCourseSelect").value;

    if (!cid) return;

    fetch(`${API_BASE}/teacher/course/${cid}/materials`)
        .then(res => res.json())
        .then(rows => {

            let tbody = document.getElementById("materialTableBody");
            tbody.innerHTML = "";

            rows.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td>${row.title}</td>
                        <td>${row.file_type.toUpperCase()}</td>
                        <td>${row.uploaded_at}</td>
                        <td>
                            <a href="${API_BASE}/${row.file_path}" 
                               target="_blank" 
                               class="btn btn-sm btn-primary">View</a>

                            <button class="btn btn-sm btn-danger" 
                                    onclick="deleteMaterial(${row.material_id})">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
}





function deleteMaterial(id) {

    if (!confirm("Delete this material?")) return;

    // ALWAYS correct URL, no trailing slash
    fetch(`${API_BASE}/teacher/materials/${id}`, {
        method: "DELETE"
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Material deleted");
            loadMaterials(document.getElementById("materialCourseSelect").value);
        } else {
            showToast("Delete failed");
        }
    });
}










// ====== SUBMISSIONS + MARKS ======
function loadSubmissions(assignmentId) {
    const userId = sessionStorage.getItem("userId");

    fetch(`${API_BASE}/teacher/submissions/${assignmentId}?userId=${userId}`)
        .then(r => r.json())
        .then(list => {

            // 1️⃣ OPEN MODAL
            const modal = new bootstrap.Modal(document.getElementById("submissionsModal"));
            modal.show();

            // 2️⃣ FILL TABLE
            const tbody = document.getElementById("submissionTableBody");
            tbody.innerHTML = "";

            (list || []).forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td>${row.full_name}</td>
                        <td>${row.submitted_at ?? "-"}</td>
                        <td>
                            <a href="${API_BASE}/${row.submission_file}" 
                               class="btn btn-sm btn-primary" 
                               target="_blank">
                               View
                            </a>
                        </td>
                        <td>
                            <input id="mark_${row.submission_id}"
                                type="number"
                                class="form-control form-control-sm"
                                value="${row.marks ?? ''}">
                        </td>
                        <td>
                            <button class="btn btn-success btn-sm"
                                    onclick="saveMarks(${row.submission_id})">
                                Save
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
}
function saveMarks(submissionId) {
    const marks = document.getElementById(`mark_${submissionId}`).value;

    fetch(`${API_BASE}/teacher/submissions/update-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, marks })
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message || "Marks updated");
    });
}



function updateMarks(submissionId) {
    const marks = document.getElementById(`marks_${submissionId}`).value;

    fetch(`${API_BASE}/teacher/submissions/update-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, marks })
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message || "Marks updated");
    });
}



function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;

    fetch(`${API_BASE}/teacher/assignments/${id}`, {
        method: "DELETE"
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Assignment deleted");
            loadAssignments(document.getElementById("assignCourseSelect").value);
        } else {
            showToast("Delete failed");
        }
    });
}
    

function saveAssignment() {
    const formData = new FormData();
    formData.append("course_id", document.getElementById("assCourseInput").value);
    formData.append("title", document.getElementById("assTitleInput").value);
    formData.append("description", document.getElementById("assDescInput").value);
    formData.append("due_date", document.getElementById("assDueInput").value);

    const file = document.getElementById("assFileInput").files[0];
    if (file) formData.append("file", file);

    fetch(`${API_BASE}/teacher/assignments`, {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Assignment saved");
            loadAssignments(document.getElementById("assignCourseSelect").value);
            bootstrap.Modal.getInstance(document.getElementById("modalAssignment")).hide();
        } else {
            showToast(res.message);
        }
    });
}

function saveMaterial() {
    const userId = sessionStorage.getItem("userId");

    const courseId = document.getElementById("matCourseInput").value;
    const title    = document.getElementById("matTitleInput").value.trim();
    const file     = document.getElementById("matFileInput").files[0];
    const fileType = document.getElementById("matTypeInput").value;

    if (!courseId || !title || !file) {
        showToast("Please fill all fields and upload a file.");
        return;
    }

    const fd = new FormData();
    fd.append("file", file);            // MUST MATCH multer.single("file")
    fd.append("course_id", courseId);
    fd.append("title", title);
    fd.append("file_type", fileType);

    fetch(`${API_BASE}/teacher/materials`, {
        method: "POST",
        body: fd
    })
    .then(r => r.json())
    .then(res => {
        console.log("UPLOAD RESPONSE:", res);

        if (res.status === "success") {
            showToast("Material uploaded");
            loadMaterials(courseId);
            bootstrap.Modal.getInstance(document.getElementById("modalMaterial")).hide();
        } else {
            showToast(res.message || "Upload failed");
        }
    });
}



function saveAssignment() {
    const formData = new FormData();
    formData.append("course_id", document.getElementById("assCourseInput").value);
    formData.append("title", document.getElementById("assTitleInput").value);
    formData.append("description", document.getElementById("assDescInput").value);
    formData.append("due_date", document.getElementById("assDueInput").value);
    formData.append("file", document.getElementById("assFileInput").files[0]);
    formData.append("userId", sessionStorage.getItem("userId"));

    fetch(`${API_BASE}/teacher/assignments`, {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === "success") {
            showToast("Assignment uploaded");
            loadAssignments(document.getElementById("assignCourseSelect").value);
            bootstrap.Modal.getInstance(document.getElementById("modalAssignment")).hide();
        } else {
            showToast(res.message);
        }
    });
}












// ====================== ENROLLMENTS ======================

// Load all students once
/********************  FIXED ENROLLMENT SECTION  ********************/

// === Load all students ===


function populateEnrollmentStudents() {
    const sel = document.getElementById("enrollStudentSelect");
    sel.innerHTML = "";

    studentsCache.forEach(s => {
        sel.innerHTML += `<option value="${s.student_id}">
            ${s.full_name} (${s.username})
        </option>`;
    });
}

function loadStudentsForEnrollment() {
    fetch(`${API_BASE}/teacher/students`)
        .then(res => res.json())
        .then(rows => {
            studentsCache = rows || [];
            populateEnrollmentStudents();
        });
}

// === When clicking enrollment tab ===
function ensureEnrollmentData() {

    fillCourseSelect("enrollCourseSelect");     // already works
    loadStudentsForEnrollment();

    const firstCourse = document.getElementById("enrollCourseSelect").value;
    if (firstCourse) loadEnrolledStudents(firstCourse);
}


// === Load enrolled students for selected course ===
function loadEnrolledStudents(courseId) {
    const userId = sessionStorage.getItem("userId");

    fetch(`${API_BASE}/teacher/course/${courseId}/enrollments?userId=${userId}`)
        .then(res => res.json())
        .then(list => {
            const tbody = document.getElementById("enrollTableBody");
            tbody.innerHTML = "";

            if (!list || list.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-muted">No students enrolled</td>
                    </tr>`;
                return;
            }

            list.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td>${row.full_name}</td>
                        <td>${row.email}</td>
                        <td>
                            <button class="btn btn-sm btn-danger"
                                onclick="deleteEnrollment(${row.id}, ${row.course_id})">
                                Remove
                            </button>
                        </td>
                    </tr>`;
            });
        });
}



function deleteEnrollment(id, courseId) {
    const userId = sessionStorage.getItem("userId");

    fetch(`${API_BASE}/teacher/enrollments/${id}?userId=${userId}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(result => {
        showToast(result.message);
        if (result.status === "success") {
            loadEnrolledStudents(courseId);
        }
    });
}


// === Enroll student ===
function enrollStudentToCourse() {
    const userId = sessionStorage.getItem("userId");
    const courseId = document.getElementById("enrollCourseSelect").value;
    const studentId = document.getElementById("enrollStudentSelect").value;

    fetch(`${API_BASE}/teacher/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, course_id: courseId, student_id: studentId })
    })
    .then(res => res.json())
    .then(result => {
        showToast(result.message);
        if (result.status === "success") {
            loadEnrolledStudents(courseId);
        }
    });
}


document.getElementById("btnEnrollStudent")
    .addEventListener("click", enrollStudentToCourse);


// === Remove student from course ===
function removeStudent(studentId, courseId) {

    fetch(`${API_BASE}/teacher/enroll?student_id=${studentId}&course_id=${courseId}`, {
        method: "DELETE"
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message);
        loadEnrolledStudents(courseId);
    });
}


// === Change event on course dropdown ===
document.getElementById("enrollCourseSelect")
    .addEventListener("change", e => loadEnrolledStudents(e.target.value));












function updateMarks(submissionId) {
    const marks = document.getElementById(`marks_${submissionId}`).value;

    fetch(`${API_BASE}/teacher/submissions/update-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, marks })
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message);
    });
}
// ====== ASSIGNMENTS ======
function loadAssignments(courseId) {
    const cid = courseId || document.getElementById("assignCourseSelect").value;
    if (!cid) return;

    fetch(`${API_BASE}/teacher/course/${cid}/assignments`)
        .then(r => r.json())
        .then(list => {
            const tbody = document.getElementById("assignTable");
            tbody.innerHTML = "";

            (list || []).forEach(a => {
                const viewAssignmentLink = a.file_path
                    ? `<a class="btn btn-sm btn-primary me-2" href="${API_BASE}/${a.file_path}" target="_blank">View</a>`
                    : `<span class="text-muted">No File</span>`;

                tbody.innerHTML += `
                    <tr>
                        <td>${a.title}</td>
                        <td>${a.due_date || "-"}</td>
                        <td>${a.created_at || "-"}</td>
                        <td>
                            ${viewAssignmentLink}
                            <button class="btn btn-sm btn-outline-secondary me-2"
                                onclick="loadSubmissions(${a.assignment_id})">
                                Submissions
                            </button>
                            <button class="btn btn-sm btn-danger"
                                onclick="deleteAssignment(${a.assignment_id})">
                                Delete
                            </button>
                        </td>
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

    fetch(`${API_BASE}/teacher/change-password`, {
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

