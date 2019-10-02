let server = new require("./server.js");
let nlp = new require("./nlp.js");
let singleUseToken = new require("./singleUseToken.js");

//Handle the post request
let processPostRequest = (body, path, callback) => {
    console.log('Process ' + path);
    if (path == '/api/v1/watson/converse') {
        try {
            if (body.constructor !== Object) {
                body = JSON.parse(body)
            }
            console.log("Connect to Watson and send transcript");
            nlp.getConverseResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {
                console.log("Watson returned a result");
                console.log("Speech: " + speech + " Instructions: " + instructions + " Conversation Payload: " + conversationPayload);
                let avatarResponse = {
                    'answer': speech,
                    'instructions': instructions
                };
                callback(JSON.stringify({
                    "answer": JSON.stringify(avatarResponse),
                    "matchedContext": "",
                    conversationPayload: JSON.stringify(conversationPayload)
                }));
            });
        } catch (e) {
            console.log(e.toString());
            callback("{}");
        }

    } else if (path == '/v2/{session=projects/*/agent/sessions/*}:detectIntent') {
        waitForDialogFlow(body, callback);
    } else if (path == '/api/public/v1/converse') {
        waitForPatAi(body, callback);
    }
}

async function waitForPatAi(body, callback) {

    console.log("Entered PAT AI loop");
    let token = '';
    if (body['fm-custom-data'].length > 0) {
        console.log("PAT AI token present");
        // Because the getPatAiToken() function returns a Promise, we should make sure that this block also returns a promise even though there is nothing async about it
        token = new Promise(function (resolve, reject) {
            resolve(body['fm-custom-data']);
            reject(console.log("the body[fm-custom-data] value did not return for some reason?"));
        })
    } else {
        console.log("PAT AI token not present - requesting...");
        token = singleUseToken.getPatAiToken();
    }

    console.log("Connect to Pat AI and send transcript");
    await nlp.getPatAiResult(body['fm-question'], token, body['fm-conversation'], (speech, instructions, conversationPayload) => {
        let avatarResponse = {
            'answer': speech,
            'instructions': instructions
        };
        callback(JSON.stringify({
            "answer": JSON.stringify(avatarResponse),
            "matchedContext": "",
            conversationPayload: JSON.stringify(conversationPayload)
        }));
    })
}

async function waitForDialogFlow(body, callback) {
    console.log("Connect to Dialogflow and send transcript");
    await nlp.getDialogFlowResult(body['fm-question'], body['fm-conversation'], (speech, instructions, conversationPayload) => {
        // console.log("Dialogflow returned a result");
        // console.log("Speech: " + speech + " Instructions: " + instructions + " Conversation Payload: " + conversationPayload);
        let avatarResponse = {
            'answer': speech,
            'instructions': instructions
        };
        callback(JSON.stringify({
            "answer": JSON.stringify(avatarResponse),
            "matchedContext": "",
            conversationPayload: JSON.stringify(conversationPayload)
        }));
    });
}

let startServer = (port) => {
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer,
    processPostRequest: processPostRequest
};