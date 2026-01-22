function showToast(message) {
    document.getElementById("toastMessage").innerText = message;
    let toast = new bootstrap.Toast(document.getElementById("toastBox"));
    toast.show();
}

function loginUser() {

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();

    // AUTO-DETECT ROLE
    let role = "";
    if (username.startsWith("t.")) role = "teacher";
    else if (username.startsWith("s.")) role = "student";
    else if (username === "admin") role = "admin";

    if (!role) {
        showToast("Invalid username format");
        return;
    }

    fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, password })
    })
    .then(res => res.json())
    .then(data => {

        if (data.status === "fail") {
            showToast(data.message);
            return;
        }

        if (data.status === "success") {

            // 🔥 Save ALL session info
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("role", data.role);
            sessionStorage.setItem("userId", data.userId);   // ← VERY IMPORTANT
            sessionStorage.setItem("username", username);
            if (data.studentId) {
    sessionStorage.setItem("studentId", data.studentId);
}



            // redirect
            if (data.role === "admin") window.location.href = "admin.html";
            else if (data.role === "teacher") window.location.href = "teacher.html";
            else if (data.role === "student") window.location.href = "student.html";
        }
    });
}


