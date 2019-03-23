jsep.addBinaryOp("!");
jsep.addBinaryOp("[");
jsep.addBinaryOp("]");
jsep.addBinaryOp("=");
jsep.addBinaryOp("#");
jsep.addBinaryOp("&");

var m2js = {};
m2js.splitNoParen = function (s) {
    let results = [];
    let next;
    let str = '';
    let left = 0, right = 0;

    function keepResult() {
        results.push(str);
        str = '';
    }

    for (var i = 0; i < s.length; i++) {
        switch (s[i]) {
            case ',':
                if ((left === right)) {
                    keepResult();
                    left = right = 0;
                } else {
                    str += s[i];
                }
                break;
            case '(':
                left++;
                str += s[i];
                break;
            case ')':
                right++;
                str += s[i];
                break;
            default:
                str += s[i];
        }
    }
    keepResult();
    return results;
}
m2js.convertToJS = function (string) {
    var array = emcellent.parse(string);
    result = m2js.processArray(array);
    return result;
}
m2js.processArray = function (array) {
    window.mumps.arrays = {};
    var result = "var mvm={};mvm.arrays={};mvm.vars={};";
    var tagLevel = 0;
    var functionCount = 0;
    var leftOvers = {};
    var ifOnLine = [];
    var forOnLine = [];
    var postConditionals = [];
    var previousDLine = -1;

    for (var i = 0; i < array.length; i++) {
        var dOnLine = 0;
        var line = array[i];
        if (line.lineLabel !== undefined) {
            if (tagLevel != 0) {
                result += "}";
                functionCount = 0;
                tagLevel--;
            }
            window.currentTag = line.lineLabel;
            tagLevel++;
            result += "mvm." + line.lineLabel + "=function";
            if (line.lineLabel.indexOf("(") > 0) {
                if (line.lineLabel.indexOf(")") < 0) {
                    throw new Error("Expected ) at end of parameter list");
                }
            } else {
                result += "()";
            }

            result += "{";
        }
        if (line.lineRoutines !== undefined) {
            var shouldLeftOver = false;
            for (var j = 0; j < line.lineRoutines.length; j++) {
                var command = line.lineRoutines[j];
                if (command.mPostConditional !== undefined) {
                    var resultCommand = "";
                    resultCommand += "if(";
                    resultCommand += m2js.handleConditional(command.mPostConditional);
                    resultCommand += "){";
                    if (shouldLeftOver) {
                        postConditionals[functionCount - 1] = true;
                        leftOvers[functionCount].push(resultCommand);
                    } else {
                        postConditionals[functionCount] = true;
                        result += resultCommand;
                    }
                }
                if (command.mRoutine == "q" && forOnLine.length > 0 && forOnLine[forOnLine.length - 1] == i) {
                    if (shouldLeftOver) {
                        leftOvers[functionCount].push("break;");
                    } else {
                        result += "break;";
                    }
                } else if (command.mRoutine == "f") {
                    var setReg = /:(?![^()]*\))/gi;
                    args = command.mArguments.split(setReg);
                    var resultCommand = "";
                    if (args.length == 3) {
                        var indexer = args[0].split("=");
                        var indexName = m2js.splitMArgs(indexer[0]);
                        resultCommand += "for(" + indexName + "=" + m2js.splitMArgs(indexer[1]) + ";" + indexName + "<=" + m2js.splitMArgs(args[2]) + ";" + indexName + "=" + indexName + "+(" + m2js.splitMArgs(args[1]) + ")){";
                    } else if (args.length == 2) {
                        var indexer = args[0].split("=");
                        var indexName = m2js.splitMArgs(indexer[0]);
                        resultCommand += "for(" + indexName + "=" + m2js.splitMArgs(indexer[1]) + ";true;" + indexName + "=" + indexName + "+(" + m2js.splitMArgs(args[1]) + ")){";
                    } else if (args.length == 1) {
                        resultCommand += "while(true){"
                    }
                    forOnLine.push(i);
                    if (shouldLeftOver) {
                        leftOvers[functionCount].push(resultCommand);
                    } else {
                        result += resultCommand;
                    }
                } else if (command.mRoutine == "i") {
                    args = m2js.splitNoParen(command.mArguments);
                    var command = "";
                    command += "if(";
                    for (var k = 0; k < args.length; k++) {
                        command += m2js.handleConditional(args[k]);
                    }
                    command += "){";
                    if (shouldLeftOver) {
                        leftOvers[functionCount].push(command);
                    } else {
                        result += command;
                    }
                    ifOnLine.push(i);
                } else if (command.mRoutine == "d" && (command.mArguments == " " || command.mArguments == "")) {
                    shouldLeftOver = true;
                    dOnLine++;
                    if (dOnLine > 1) {
                        leftOvers[functionCount].push("inter_" + functionCount + "();");
                    } else if (line.lineIndentationArray === undefined || line.lineIndentationArray.length >= functionCount) {
                        functionCount++;
                        previousDLine = i;
                        result += "function inter_" + functionCount + "() {"
                        leftOvers[functionCount] = [];
                    }
                } else {
                    if (i != previousDLine && previousDLine != -1 && (line.lineIndentationArray === undefined || line.lineIndentationArray.length < functionCount - 1)) {
                        while (functionCount > 0) {
                            result += "};inter_" + functionCount + "();";
                            leftOvers[functionCount].forEach(item => {
                                result += item;
                            });
                            functionCount--;
                        }
                        while (ifOnLine.length > 0) {
                            result += "}";
                            ifOnLine.pop();
                        }
                        while (forOnLine.length > 0) {
                            result += "}";
                            forOnLine.pop();
                        }
                        if (postConditionals[functionCount]) {
                            result += "}";
                            postConditionals[functionCount] = false;
                        }
                        dOnLine = 0;
                        previousDLine = -1;
                        leftOvers = {};
                        shouldLeftOver = false;
                    }
                    var cmd = m2js.convertCommand(command);
                    if (shouldLeftOver) {
                        leftOvers[functionCount].push(cmd);
                    } else {
                        result += cmd;
                    }

                }
                if (postConditionals[functionCount] && dOnLine == 0) {
                    if (shouldLeftOver) {
                        leftOvers[functionCount].push("}");
                    } else {
                        result += "}";
                    }
                    postConditionals[functionCount] = false;
                }
            }
        }
        if (ifOnLine.includes(i) && dOnLine == 0) {
            result += "}";
            ifOnLine.pop();
        }
        if (forOnLine.includes(i) && dOnLine == 0) {
            result += "}";
            forOnLine.pop();
        }
    }
    result += "};mvm.main();";
    return result;
}

m2js.conditionalChange = {
    "=": "==",
    "!": "||",
    "#": "%",
    "&": "&&"
};


m2js.handleConditional = function (args) {
    var args = jsep(args);
    function recurseCondition(array) {
        if (array.type == "CallExpression") {
            var result = array.callee.name + "(";
            array.arguments.forEach(function (arg) {
                result += recurseCondition(arg) + ",";
            });
            if (result.charAt(result.length - 1) == ",") {
                result = result.substring(0, result.length - 1)
            }
            result += ")";
            return m2js.splitMArgs(result);
        }
        if (array.type == "Literal") {
            return array.raw;
        }
        if (array.type == "Identifier") {
            return m2js.splitMArgs(array.name);
        }
        array.operator = m2js.conditionalChange[array.operator] || array.operator;
        return recurseCondition(array.left) + array.operator + recurseCondition(array.right);
    }
    return recurseCondition(args);
}

m2js.firstConditionalIndex = function (string) {
    var lowestIndex = string.length;
    var lowestSplitter = "";
    var splitters = ["==", "<", ">", "%", "-", "+", "&&", "||"];
    splitters.forEach(function (splitter) {
        var index = string.indexOf(splitter);
        if (index != -1 && (index < lowestIndex)) {
            lowestIndex = index;
            lowestSplitter = splitter;
        }
    });
    return [lowestSplitter, lowestIndex];
}

m2js.convertCommand = function (command) {
    var arguments = command.mArguments;
    if (typeof m2js["processCMD_" + command.mRoutine] === "function") {
        return m2js["processCMD_" + command.mRoutine](arguments);
    }
    var result = "mumps." + command.mRoutine + "(" + arguments + ")";
    result += ";";
    return result;
}

m2js.processArgs = function (args) {
    if (args === undefined || args == "" || args == " ") {
        return "";
    }
    if (args.charAt(0) == '"' || !isNaN(args.charAt(0))) {
        return args;
    }
    if (args == '""') {
        return "''";
    }
    if (args.startsWith("$$")) {
        return "mumps_" + args.split("$$")[1];
    }
    if (args.startsWith("$")) {
        var funcName = args.substring(args.indexOf("$") + 1, args.indexOf("("));
        if (typeof m2js["processFUNC_" + funcName] === "function") {
            return m2js["processFUNC_" + funcName](args.substring(args.indexOf("(") + 1, args.lastIndexOf(")")));
        }
        return "mumps." + args.split("$")[1];
    }
    if (/%?[a-z]+[0-z]*/i.test(args) && args.indexOf("(") != -1) {
        var arrayName = "mvm.arrays." + args.split("(")[0];
        return arrayName + "['" + args.substring(args.indexOf("(") + 1, args.lastIndexOf(")")).replace(/^"(.*)"$/, '$1') + "']";
    }
    if (args.startsWith("mvm.vars.")) {
        return args;
    } else {
        return "mvm.vars." + args;
    }

}

m2js.processCMD_q = function (args) {
    if (args === undefined || args == "" || args == " ") {
        return "return;";
    } else {
        return "return " + m2js.splitMArgs(args) + ";";
    }
}

m2js.processCMD_d = function (args) {
    args = m2js.splitNoParen(args);
    var result = "";
    for (var i = 0; i < args.length; i++) {
        result += m2js.splitMArgs("mumps_" + args[i]) + "();";
    }
    return result;
}

m2js.processFUNC_L = function (args) {
    args = m2js.splitNoParen(args);
    if (args[0].startsWith("mvm.vars.")) {
        if (args[1] !== undefined) {
            return "String(" + args[0] + ").split(" + args[1] + ").length";
        }
        return "String(" + args[0] + ").length";
    }
    if (args.length == 2) {
        args[1] = m2js.splitMArgs(args[1]);
        if (args[1] == '""') {
            return 1;
        }
        if (args[1].indexOf("(") == -1) {
            return "String(" + args[0] + ").split(" + args[1] + ").length";
        } else {
            return '"' + args[0].replace(/^"(.*)"$/, '$1').split(args[1].replace(/^"(.*)"$/, '$1')).length + '"';
        }
    } else if (args.length == 1) {
        if (args[0].indexOf("(") != -1) {
            return args[0];
        }
        return '"' + m2js.splitMArgs(args[0].replace(/^"(.*)"$/, '$1')).length + '"';
    } else {
        throw new Error("Invalid number of parameters");
    }
}

m2js.processFUNC_E = function (args) {
    args = m2js.splitNoParen(args);
    if (args[0].startsWith("window.")) {
        args[0] = eval(args[0]);
    }
    if (args.length == 1) {
        return '"' + m2js.splitMArgs(args[0]).replace(/^"(.*)"$/, '$1').substring(0, 1) + '"';
    } else if (args.length == 2) {
        return '"' + m2js.splitMArgs(args[0]).replace(/^"(.*)"$/, '$1').substring(args[1] - 1, args[1]) + '"';
    } else if (args.length == 3) {
        if (args[0].length < args[2]) {
            args[2] = args[0].length;
        }
        return '"' + m2js.splitMArgs(args[0]).replace(/^"(.*)"$/, '$1').substring(args[1] - 1, args[2]) + '"';
    } else {
        throw new Error("Invalid number of parameters");
    }
}

m2js.processCMD_s = function (args) {
    args = m2js.splitNoParen(args);
    var result = "";
    for (var i = 0; i < args.length; i++) {
        var split = args[i].split("=");
        if (split[0].startsWith("$P")) {
            var inside = split[0].substring(split[0].indexOf("(") + 1, split[0].lastIndexOf(")"));
            inside = m2js.splitNoParen(inside);
            var variable = m2js.splitMArgs(inside[0]);
            if (inside[2] === undefined) {
                inside[2] = "1";
            }
            result += variable + '=mumps.setP(' + variable + ',' + m2js.splitMArgs(inside[1]) + "," + m2js.splitMArgs(inside[2]) + ",";
            if (inside[3] !== undefined) {
                result += m2js.splitMArgs(inside[3]);
            } else {
                result += m2js.splitMArgs(inside[2]);
            }
            result += "," + m2js.splitMArgs(split[1]) + ");";
        } else if (split[0].startsWith("$E")) {
            var inside = split[0].substring(split[0].indexOf("(") + 1, split[0].lastIndexOf(")"));
            inside = m2js.splitNoParen(inside);
            if (window.mumps.arrays[inside[0]] === undefined) {
                throw new Error("First argument of $E must be a variable.");
            }
            if (inside[1] === undefined) {
                inside[1] = 1;
            }
            if (isNaN(inside[1])) {
                throw new Error("Start must be a number.");
            }
            var variable = m2js.splitMArgs(inside[0])
            result += variable + '=mumps.setE(' + variable + ',' + m2js.splitMArgs(inside[1]) + ",";
            if (inside[2] !== undefined) {
                result += m2js.splitMArgs(inside[2]);
            } else {
                result += m2js.splitMArgs(inside[1]);
            }
            result += "," + m2js.splitMArgs(split[1]) + ");";
        } else {
            var left = m2js.splitMArgs(split[0]);
            var right = m2js.splitMArgs(split[1]);

            if (left.startsWith("mvm.arrays.")) {
                var name = left.substring(0, left.indexOf("["));
                if (window.mumps.arrays[name] === undefined) {
                    result += name + "={};"
                    window.mumps.arrays[name] = true;
                }
            } else {
                if (window.mumps.arrays[left] === undefined) {
                    window.mumps.arrays[left] = true;
                }
            }
            result += left + "=" + right + ";";
        }
    }
    return result;
}

m2js.splitMArgs = function (args) {
    var result = "";
    var argStr = args;
    args = m2js.splitNoParen(args);

    if (args.length == 1) {
        if (args[0].charAt(0) == '"' || !isNaN(args[0].charAt(0))) {
            return args[0];
        }
    }

    for (var i = 0; i < args.length; i++) {
        var thisArg = args[i].substring(0, args[i].indexOf("("));
        argStr = args[i].substring(args[i].indexOf("(") + 1, args[i].lastIndexOf(")"))
        if (args[i].indexOf("(") != -1) {
            result += m2js.processArgs(thisArg + "(" + m2js.splitMArgs(argStr) + ")") + ",";
        } else {
            result += m2js.processArgs(args[i]) + ",";
        }
    }
    return result.replace(/^,|,$/g, '');
}

m2js.processCMD_w = function (args) {
    var result = "";
    args = m2js.splitNoParen(args);
    for (var i = 0; i < args.length; i++) {
        result += m2js.splitMArgs(args[i]) + ",";
    }
    return "console.log(" + result.replace(/^,|,$/g, '') + ");";
};

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    search = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return target.replace(new RegExp(search, 'g'), replacement);
};

window.mumps = {};
window.mumps.arrays = {};
window.mumps.w = console.log;
window.mumps.P = function (variable, delimiter, start, end) {
    var splitted = variable.split(delimiter);
    if (start === undefined) {
        start = 1;
    }
    if (end === undefined || end == start) {
        return splitted[start - 1];
    }
    if (end > splitted.length) {
        end = splitted.length;
    }
    var result = "";
    for (var i = start - 1; i < end; i++) {
        result += splitted[i];
    }
    return result;
};
window.mumps.L = function (variable, occurance) {
    if (occurance === undefined) {
        return variable.length;
    } else {
        return variable.split(occurance).length;
    }
}
window.mumps.setP = function (variable, delimiter, start, end, replace) {
    var splitted = variable.split(delimiter);
    start = start - 1;
    end = end - 1;
    if (end > splitted.length) {
        end = splitted.length;
    }
    var result = "";
    var replaceDone = false;
    for (var i = 0; i < splitted.length; i++) {
        if (i >= start && i <= end) {
            if (replaceDone == false) {
                result += replace;
                replaceDone = true;
            }
            if (i == end && i != splitted.length - 1) {
                result += delimiter;
            }
        } else {
            result += splitted[i];
            if (i != splitted.length - 1) {
                result += delimiter;
            }
        }
    }
    return result;
};
window.mumps.setE = function (variable, start, end, replace) {
    start = start - 1;
    end = end - 1;
    if (end > variable.length) {
        end = variable.length;
    }
    var result = "";
    var replaceDone = false;
    for (var i = 0; i < variable.length; i++) {
        if (i >= start && i <= end) {
            if (replaceDone == false) {
                result += replace;
                replaceDone = true;
            }
        } else {
            result += variable.charAt(i);
        }
    }
    return result;
};