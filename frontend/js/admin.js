const API_BASE_URL = "https://arms-assignment-and-resources-management-system.up.railway.app";

function showSection(section) {
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");

    document.getElementById(`section-${section}`).style.display = "block";
}

function showToast(msg) {
    document.getElementById("toastMessage").innerText = msg;
    let t = new bootstrap.Toast(document.getElementById("toastBox"));
    t.show();
}

// ============================== LOAD TEACHERS ==============================

function loadTeachers() {
    fetch(`${API_BASE_URL}/admin/teachers`)
    .then(res => res.json())
    .then(data => {

        teacherData = data;  // <-- IMPORTANT

        let table = document.querySelector("#teacherTable tbody");
        table.innerHTML = "";

        data.forEach(t => {
            table.innerHTML += `
                <tr>
                    <td>${t.username}</td>
                    <td>${t.full_name}</td>
                    <td>${t.email}</td>
                    <td>${t.status}</td>
                    <td>
                        <button class="sap-btn" onclick="openEditTeacher(${t.teacher_id})">Edit</button>
                        <button class="sap-btn sap-btn-danger" onclick="openDeleteTeacher(${t.teacher_id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    });
}


// ============================== LOAD STUDENTS ==============================

function loadStudents() {
    fetch(`${API_BASE_URL}/admin/students`)
        .then(res => res.json())
        .then(data => {
            let tbody = document.querySelector("#studentsTable tbody");
            tbody.innerHTML = "";

            data.forEach(s => {
                tbody.innerHTML += `
                    <tr>
                        <td>${s.username}</td>
                        <td>${s.full_name}</td>
                        <td>${s.email}</td>
                        <td>${s.status}</td>
                        <td>
                            <button class="sap-btn-secondary btn-sm" onclick="openEditStudent(${s.id})">Edit</button>
                            <button class="sap-btn-danger btn-sm" onclick="openDeleteStudent(${s.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        });
}


// ============================== LOAD COURSES ==============================

function loadCourses() {
    fetch(`${API_BASE_URL}/admin/courses`)

        .then(res => res.json())
        .then(data => {
            let table = document.querySelector("#courseTable tbody");
            table.innerHTML = "";

            data.forEach(c => {
                table.innerHTML += `
    <tr>
        <td>${c.course_name}</td>
        <td>${c.teacher_name}</td>
        <td>${c.status}</td>
        <td>
            <button class="sap-btn" onclick="openEditCourse(${c.course_id})">Edit</button>
            <button class="sap-btn sap-btn-danger" onclick="openDeleteCourse(${c.course_id})">Delete</button>
        </td>
    </tr>
`;
            });
        });
}

// Call on page load
loadTeachers();
loadStudents();
loadCourses();
function logout() {
    // Remove any session info saved in browser
    sessionStorage.clear();
    localStorage.clear();

    // Prevent back button
    history.replaceState({}, "", "login.html");

    // Redirect
    window.location.href = "login.html";
}
function openTeacherForm() {
    new bootstrap.Modal(document.getElementById("modalAddTeacher")).show();
}

function openStudentForm() {
    new bootstrap.Modal(document.getElementById("modalAddStudent")).show();
}

function openCourseForm() {
    loadTeacherDropdown();
    new bootstrap.Modal(document.getElementById("modalAddCourse")).show();
}
function saveTeacher() {
    let fullname = document.getElementById("t_fullname").value;
    let email = document.getElementById("t_email").value;

    fetch(`${API_BASE_URL}/admin/add-teacher`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email })
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message);
        loadTeachers();
        bootstrap.Modal.getInstance(document.getElementById("modalAddTeacher")).hide();
    });
}

function saveCourse() {
    let name = document.getElementById("c_name").value;
    let teacher_id = document.getElementById("c_teacher").value;

    fetch(`${API_BASE_URL}/admin/add-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, teacher_id })
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message);
        loadCourses();
        bootstrap.Modal.getInstance(document.getElementById("modalAddCourse")).hide();
    });
}
function loadTeacherDropdown() {
    fetch(`${API_BASE_URL}/admin/teachers`)
        .then(res => res.json())
        .then(data => {
            let sel = document.getElementById("c_teacher");
            sel.innerHTML = "";

            data.forEach(t => {
                sel.innerHTML += `<option value="${t.teacher_id}">${t.full_name}</option>`;
            });
        });
}
function saveTeacher() {
    let fullname = document.getElementById("t_fullname").value;
    let email = document.getElementById("t_email").value;

    fetch(`${API_BASE_URL}/admin/add-teacher`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showToast(`Teacher created. Username: ${data.username} | Password: ${data.password}`);
            loadTeachers();
            bootstrap.Modal.getInstance(document.getElementById("modalAddTeacher")).hide();
        } else {
            showToast(data.message);
        }
    });
}

function showCredentialsPopup(username, password) {
    document.getElementById("cred_username").value = username;
    document.getElementById("cred_password").value = password;

    new bootstrap.Modal(document.getElementById("modalCredentials")).show();
}

function copyCredentials(id) {
    let input = document.getElementById(id);
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
}
function saveTeacher() {
    let fullname = document.getElementById("t_fullname").value;
    let email = document.getElementById("t_email").value;

   fetch(`${API_BASE_URL}/admin/add-teacher`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "success") {
            // show popup instead of toast
            showCredentialsPopup(data.username, data.password);

            // clear form
            document.getElementById("t_fullname").value = "";
            document.getElementById("t_email").value = "";

            // reload table
            loadTeachers();

            // close modal
            bootstrap.Modal.getInstance(document.getElementById("modalAddTeacher")).hide();
        } else {
            showToast(data.message);
        }
    });
}

function openEditTeacher(id) {
    let t = teacherData.find(x => x.teacher_id == id);

    document.getElementById("edit_teacher_id").value = t.teacher_id;
    document.getElementById("edit_teacher_name").value = t.full_name;
    document.getElementById("edit_teacher_email").value = t.email;

    new bootstrap.Modal(document.getElementById("modalEditTeacher")).show();
}
function confirmDeleteTeacher() {
    let id = document.getElementById("delete_teacher_id").value;

    fetch(`${API_BASE_URL}/admin/delete-teacher?id=${id}`, {

        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {

        showToast(data.message);
        loadTeachers();

        // ★ FIX aria-hidden warning
        document.activeElement.blur();

        bootstrap.Modal.getInstance(
            document.getElementById("modalDeleteTeacher")
        ).hide();
    });
}

function loadStudents() {
    fetch(`${API_BASE_URL}/admin/students`)
    .then(res => res.json())
    .then(data => {
        studentData = data;
        let table = document.querySelector("#studentTable tbody");
        table.innerHTML = "";

        data.forEach(s => {
            table.innerHTML += `
                <tr>
                    <td>${s.username}</td>
                    <td>${s.full_name}</td>
                    <td>${s.email}</td>
                    <td>${s.status}</td>
                    <td>
                        <button class="sap-btn" onclick="openEditStudent(${s.student_id})">Edit</button>
                        <button class="sap-btn-danger" onclick="openDeleteStudent(${s.student_id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    });
}

function openEditStudent(id) {
    let s = studentData.find(x => x.student_id == id);

    document.getElementById("edit_student_id").value = s.student_id;
    document.getElementById("edit_student_name").value = s.full_name;
    document.getElementById("edit_student_email").value = s.email;

    new bootstrap.Modal(document.getElementById("modalEditStudent")).show();
}
function saveStudent() {
    let fullname = document.getElementById("s_fullname").value.trim();
    let email = document.getElementById("s_email").value.trim();

    fetch(`${API_BASE_URL}/admin/add-student`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "success") {

            // ⭐ SHOW POPUP WITH USERNAME + PASSWORD
            showCredentialsPopup(data.username, data.password);

            // ⭐ CLEAR FORM INPUTS
            document.getElementById("s_fullname").value = "";
            document.getElementById("s_email").value = "";

            // ⭐ REFRESH TABLE
            loadStudents();

            // ⭐ CLOSE ADD STUDENT MODAL
            bootstrap.Modal.getInstance(
                document.getElementById("modalAddStudent")
            ).hide();

        } else {
            showToast(data.message);
        }
    });
}

function showSection(sec) {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(`section-${sec}`).style.display = "block";

    // when loading enrollment page
    if (sec === "enrollment") {
        loadEnrollmentData();
    }
}
function loadEnrollmentData() {

    // Load Courses for both dropdowns
    fetch(`${API_BASE_URL}/admin/enroll/courses`)
        .then(r => r.json())
        .then(list => {
            let sc = document.getElementById("enroll_student_course");
            let tc = document.getElementById("assign_teacher_course");

            sc.innerHTML = "";
            tc.innerHTML = "";

            list.forEach(c => {
                sc.innerHTML += `<option value="${c.course_id}">${c.course_name}</option>`;
                tc.innerHTML += `<option value="${c.course_id}">${c.course_name}</option>`;
            });
        });

    // Load Students
    fetch(`${API_BASE_URL}/admin/enroll/students`)
        .then(r => r.json())
        .then(list => {
            let s = document.getElementById("enroll_student");
            s.innerHTML = "";
            list.forEach(st => {
                s.innerHTML += `<option value="${st.student_id}">${st.full_name} (${st.username})</option>`;
            });
        });

    // Load Teachers
    fetch(`${API_BASE_URL}/admin/enroll/teachers`)
        .then(r => r.json())
        .then(list => {
            let t = document.getElementById("assign_teacher");
            t.innerHTML = "";
            list.forEach(th => {
                t.innerHTML += `<option value="${th.teacher_id}">${th.full_name} (${th.username})</option>`;
            });
        });
}
function enrollStudent() {
    const student_id = document.getElementById("enroll_student").value;
    const course_id  = document.getElementById("enroll_student_course").value;

    fetch(`${API_BASE_URL}/admin/enroll/enroll-student`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id, course_id })
    })
    .then(r => r.json())
    .then(res => showToast(res.message));
}
function assignTeacher() {
    const teacher_id = document.getElementById("assign_teacher").value;
    const course_id  = document.getElementById("assign_teacher_course").value;

   fetch(`${API_BASE_URL}/admin/enroll/enroll-teacher`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id, course_id })
    })
    .then(r => r.json())
    .then(res => showToast(res.message));
}

function saveEditStudent() {
    fetch(`${API_BASE_URL}/admin/edit-student`, {

        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            id: document.getElementById("edit_student_id").value,
            fullname: document.getElementById("edit_student_name").value,
            email: document.getElementById("edit_student_email").value
        })
    })
    .then(res => res.json())
    .then(data => {
        showToast("Student updated");
        loadStudents();
        bootstrap.Modal.getInstance(document.getElementById("modalEditStudent")).hide();
    });
}
function openDeleteStudent(id) {
    document.getElementById("delete_student_id").value = id;
    new bootstrap.Modal(document.getElementById("modalDeleteStudent")).show();
}

function confirmDeleteStudent() {
    let id = document.getElementById("delete_student_id").value;

    fetch(`${API_BASE_URL}/admin/delete-student?id=${id}`, {

        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        showToast("Student deleted");
        loadStudents();
        bootstrap.Modal.getInstance(document.getElementById("modalDeleteStudent")).hide();
    });
}


function saveEditCourse() {

    const id = document.getElementById("edit_course_id").value;
    const name = document.getElementById("editCourseName").value;
    const teacher_id = document.getElementById("editCourseTeacher").value;

    if (!id || !name || !teacher_id) {
        showToast("Missing fields", "danger");
        return;
    }

    fetch(`${API_BASE_URL}/admin/edit-course`, {

        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, teacher_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            showToast("Course updated", "success");
            loadCourses();
            bootstrap.Modal.getInstance(document.getElementById("modalEditCourse")).hide();
        } else {
            showToast(data.message, "danger");
        }
    });
}



function openDeleteCourse(id) {
    document.getElementById("delete_course_id").value = id;
    new bootstrap.Modal(document.getElementById("modalDeleteCourse")).show();
}

function confirmDeleteCourse() {
    let id = document.getElementById("delete_course_id").value;

    fetch(`${API_BASE_URL}/admin/delete-course?id=${id}`, {

        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        showToast("Course deleted");
        loadCourses();
        bootstrap.Modal.getInstance(document.getElementById("modalDeleteCourse")).hide();
    });
}
let selectedCourseId = null;

function openEditCourse(id, name, teacherName, teacherId) {
 editCourseId = id;
    // Store ID
    document.getElementById("edit_course_id").value = id;

    // Fill course name
    document.getElementById("editCourseName").value = name;

    // Load teacher list
    fetch(`${API_BASE_URL}/admin/teachers`)

        .then(res => res.json())
        .then(teachers => {

            const dropdown = document.getElementById("editCourseTeacher");
            dropdown.innerHTML = "";

            dropdown.innerHTML = `<option value="">-- Select Teacher --</option>`;

            teachers.forEach(t => {
                dropdown.innerHTML += `
                    <option value="${t.teacher_id}" 
                    ${t.full_name === teacherName ? "selected" : ""}>
                        ${t.full_name}
                    </option>
                `;
            });

        });

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("modalEditCourse"));
    modal.show();
}

async function loadTeachersIntoDropdown(elementId, selectedId = null) {
    const dropdown = document.getElementById(elementId);

    const res = await fetch(`${API_BASE_URL}/admin/teachers`);

    const list = await res.json();

    dropdown.innerHTML = `<option value="">-- Select Teacher --</option>`;

    list.forEach(t => {
        dropdown.innerHTML += `
            <option value="${t.teacher_id}" ${selectedId == t.teacher_id ? "selected" : ""}>
                ${t.full_name}
            </option>
        `;
    });
}
function saveAddStudent() {
    let full_name = document.getElementById("addStudentFullname").value;
    let email = document.getElementById("addStudentEmail").value;

    fetch(`${API_BASE_URL}/admin/add-student`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);

        if (data.status !== "success") {
            showToast(data.message || "Error creating student");
            return;
        }

        showToast("Student created: " + data.username);

        // refresh table
        loadStudents();

        // close modal
        let modal = bootstrap.Modal.getInstance(document.getElementById("modalAddStudent"));
        modal.hide();
    });
}
function updateAdminPassword() {
    let adminId = sessionStorage.getItem("userId");
    let oldPass = document.getElementById("admin_oldpass").value;
    let newPass = document.getElementById("admin_newpass").value;
    let confirmPass = document.getElementById("admin_confirmpass").value;

    if (newPass !== confirmPass) {
        showToast("New passwords do not match");
        return;
    }

    fetch(`${API_BASE_URL}/admin/change-password`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            adminId,
            oldPassword: oldPass,
            newPassword: newPass
        })
    })
    .then(res => res.json())
    .then(data => showToast(data.message));
}






