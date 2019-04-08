firebase.auth().onAuthStateChanged(function (user) {
    window.user = user;
    if (user) {
        $("#titlebar .login").remove();
        db.collection("users").doc(user.uid).get().then((userInfo) => {
            var data = userInfo.data();
            var name = data.firstName + " " + data.lastName;
            var points = data.points === undefined ? 0 : data.points;

            var submitButton = $("#submitExercise");
            if(data.completed.includes(getUrlParameter("id"))) {
                submitButton.before("<div id='exerciseComplete'>Exercise Completed</div>");
                submitButton.remove();
            }

            $("#titlebar").append('<div id="userInfo"><a href="dashboard.html">Dashboard</a><a>'+name+'</a><a>'+points+'pts</a><a>Ranked #1 in US</a><a onclick="signOut()">Sign Out</a></div>');
        });
    }
});

function signOut() {
    firebase.auth().signOut().then(function () {
        window.location = "index.html";
    }).catch(function (error) {
        alert("Unable to sign out");
    });
}