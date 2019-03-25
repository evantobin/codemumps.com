firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        window.location = "dashboard.html";
    }
});

function register() {
    $("#errormessage").remove();
    var email = $("#email").val();
    var password = $("#password").val();
    var cPassword = $("#cpassword").val();
    var fName = $("#firstname").val();
    var lName = $("#lastname").val();
    var country = $("#country").val();

    if ([email, password, cPassword, fName, lName].filter(item => item == "" || item === undefined).length > 0) {
        $("form").before("<div id='errormessage'>Fill out all fields</div>");
        return;
    }

    if (cPassword != password) {
        $("form").before("<div id='errormessage'>Password and password confirmation do not match.</div>");
        return;
    }
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (user) {
            return db.collection("users").doc(user.user.uid).set({
                firstName: fName,
                lastName: lName,
                country: country
            });
        }).then(function () {
            window.location = "dashboard.html";
        }).catch(function (error) {
            $("form").before("<div id='errormessage'>" + error.message + "</div>");
        });
}

function login() {
    var email = $("#email").val();
    var password = $("#password").val();
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function () {
            window.location = "dashboard.html";
        })
        .catch(function (error) {
            $("form").before("<div id='errormessage'>" + error.message + "</div>");
        });
}

function resetPassword() {
    var email = $("#email").val();
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        $("form").html("Email sent!");
    }).catch(function (error) {
        $("form").before("<div id='errormessage'>" + error.message + "</div>");
    });
}