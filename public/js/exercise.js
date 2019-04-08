window.exerciseID = getUrlParameter("id");
db.collection("exercise").doc(window.exerciseID).get().then(function (doc) {
    var data = doc.data();
    data.code = data.code.replace(/\\n/g, "\n");
    $("#exercise h1").text(data.title);
    $("#exercise p").html(data.description);
    var editor = document.getElementById('mIDE');
    if (editor.contentWindow.window.editor !== undefined && data.code !== undefined) {
        editor.contentWindow.window.editor.setValue(data.code);
    } else {
        editor.onload = function () {
            editor.contentWindow.window.editor.setValue(data.code);
        }
    }
}).catch(function (error) {
    console.log("Error getting cached document:", error);
});

var fireValidate = firebase.functions().httpsCallable('validateAnswer');

function validateAnswer(text) {
    return fireValidate({ id: window.exerciseID, content: text });
}

function submitSolution() {
    var iframe = $('#mIDE'); // or some other selector to get the iframe
    iframe[0].contentWindow.runCode();
    var text = $('#console', iframe.contents()).html();
    validateAnswer(text).then(function(value) {
        if(value.data===true) {
            startConfetti();
            alert("You've completed the exercise. Appropriate points have been added to your account.")
        } else {
            alert("That isn't quite it. Try again.")
        }
    });
}