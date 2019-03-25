firebase.auth().onAuthStateChanged(function(user) {
    window.user = user;
    if (user) {
        $("#titlebar .login").remove();
        $("#titlebar").append('<div id="userInfo"><a>My Account</a><a>Evan Tobin</a><a>1000pts</a><a>Ranked #1 in US</a><a onclick="signOut()">Sign Out</a></div>');
    }
});

function signOut() {
    firebase.auth().signOut().then(function() {
        window.location = "index.html";
      }).catch(function(error) {
        alert("Unable to sign out");
      });
}