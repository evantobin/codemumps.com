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
    fireValidate({ id: window.exerciseID, content: text }).then(function (result) {
        console.log(result);
    });
}