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
        if (body['fm-custom-data'].length > 0) {
            waitForPatAi(body, callback, body['fm-custom-data']); // We have the Auth Token and have passed it to UneeQ on first inquiry
        } else {
            var token = singleUseToken.getPatAiToken();
            waitForPatAi(body, callback, token); // We just got a token so we'll send it along with our first request to Pat AI
        }

    }

}

async function waitForPatAi(body, callback, token) {
    console.log("Connect to Pat AI and send transcript");
    await nlp.queryPatAi(body['fm-question'], token, body['fm-conversation'], (speech, instructions, conversationPayload) => {
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