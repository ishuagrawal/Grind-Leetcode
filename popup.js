const LEETCODE_ENDPOINT = 'https://quiet-bastion-42623.herokuapp.com/leetcode.com/graphql';

// Get Daily Coding Challenge
const QUERY_DCC = `
    query questionOfToday {
        activeDailyCodingChallengeQuestion {
            date
            userStatus
            link
            question {
                acRate
                difficulty
                freqBar
                frontendQuestionId: questionFrontendId
                isFavor
                paidOnly: isPaidOnly
                status
                title
                titleSlug
                hasVideoSolution
                hasSolution
                topicTags {
                name
                id
                slug
                }
            }
        }
    }
`;


// retrieves DCC
window.onload = async function() {   
    chrome.storage.sync.get({'authToken':'none'}, function(data) {
        if (data.authToken === "none") {
            document.getElementById("todoistAdd").setAttribute("data-bs-target", "#todoistModal");
            document.getElementById('signOut').style.display = "none";
        } else {
            document.getElementById("todoistAdd").setAttribute("data-bs-target", "#tasksModal");
            document.getElementById('signOut').style.display = "block";
        }
    });

    // chrome.storage.sync.remove('time', function() {});
    chrome.storage.sync.get({time:'none'}, function(data) {
        if (data.time === 'none') {
            chrome.storage.sync.set({ "question": "none" });
            const now = new Date();
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0, 0);

            const millisTill17 = target - now;
            if (millisTill17 < 0) {
                tick(target.getTime());
            } else {
                chrome.storage.sync.set({ "time": target.getTime() });
            }
        } else {
            if (Date.now() >= data.time) {
                tick(data.time);
                chrome.storage.sync.set({ "question": "none" });
            }
        }

        chrome.storage.sync.get({question:'none'}, async function(data) {
            if (data.question === 'none') {
                const json = await getDCC();
                const question = JSON.stringify(json["data"]["activeDailyCodingChallengeQuestion"]);
                chrome.storage.sync.set({ "question": question }, function() {
                    const dcc = json["data"]["activeDailyCodingChallengeQuestion"];
                    editHomePage(dcc);
                });
            } else {
                const json = JSON.parse(data.question);
                editHomePage(json);
            }
        });
    });
}


// updates time checker for next day (24 hours later)
function tick(origDate) {
    // Re-calculate the timestamp for the next day
    var next = origDate + (24 * 60 * 60 * 1000);
    chrome.storage.sync.set({ "time": next });

}


// returns JSON object for DCC
async function getDCC() {
    const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({query: QUERY_DCC})
    };

    const response = await fetch(LEETCODE_ENDPOINT, init);
    const json = await response.json();
    return json
}


// updates frontend
function editHomePage(data) {
    const title = data["question"]["title"];
    const idNum = data["question"]["frontendQuestionId"];
    const link = "https://leetcode.com" + data["link"];
    const difficulty = data["question"]["difficulty"];
    
    document.querySelector(".card-title").innerHTML += (idNum + ". " + title);
    document.getElementById('questionLink').setAttribute('href', link);

    if (difficulty === "Easy") {
        document.getElementById('dccCard').style.border = '2px solid #00B8A2';
    }
    else if (difficulty === "Medium") {
        document.getElementById('dccCard').style.border = '2px solid #ED8026';
    }
    else if (difficulty === "Hard") {
        document.getElementById('dccCard').style.border = '2px solid #FF375F';
    }

    const topicTags = data["question"]["topicTags"];
    let topics = "";
    for (const topic of topicTags) {
        topics += (topic["name"] + ", ");
    }
    topics = topics.substring(0, topics.length-2);

    document.getElementById("topics").innerHTML = topics;
    document.getElementById("dccCard").style.display = "block";
}


// POST request for creating a Todoist task
async function createTask(token) {
    chrome.storage.sync.get({question:'none'}, async function(data) {
        const json = JSON.parse(data.question);

        const title = json["question"]["title"];
        const idNum = json["question"]["frontendQuestionId"];
        const link = "https://leetcode.com" + json["link"];
        const difficulty = json["question"]["difficulty"];

        const description = `${idNum}. ${title}
        Difficulty: ${difficulty}
        Link: ${link}`
        const init = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({"content": "Complete Leetcode daily coding challenge.", "due_string": "today", "description": description})
        };
    
        const response = await fetch("https://api.todoist.com/rest/v1/tasks", init);
        const datum = await response.json();
        return datum;
    });
}


document.getElementById("signOut").addEventListener('click', function() {
    chrome.storage.sync.remove('authToken', function() {
        document.getElementById('signOut').style.display = "none";
        document.getElementById("todoistAdd").setAttribute("data-bs-target", "#todoistModal");

        document.getElementById('toast').style.backgroundColor = "rgb(172, 230, 172)";
        document.getElementById('message').innerHTML = "Success! Signed out of Todoist!";
        var toastExample = document.getElementById('toast');
        var myToast = bootstrap.Toast.getInstance(toastExample)
        if (myToast) {
            myToast.dispose();
        }
        var toast = new bootstrap.Toast(toastExample);
        toast.show();
    });

})


// Connecting to Todoist (OAuth 2.0)
document.querySelector('#connect').addEventListener('click', function () {
    msg = chrome.runtime.sendMessage({ message: 'login' });
    msg.then(response => {
        if (response.message === 'success') {
            document.getElementById("close").click();
            document.getElementById("todoistAdd").setAttribute("data-bs-target", "#tasksModal");
            document.getElementById('signOut').style.display = "block";

            document.getElementById('toast').style.backgroundColor = "rgb(172, 230, 172)";
            document.getElementById('message').innerHTML = "Success! Connected to Todoist!";
            var toastExample = document.getElementById('toast');
            var myToast = bootstrap.Toast.getInstance(toastExample)
            if (myToast) {
                myToast.dispose();
            }
            var toast = new bootstrap.Toast(toastExample);
            toast.show();
        } else {
            console.log("Error");
            document.getElementById("close").click();
            document.getElementById("todoistAdd").setAttribute("data-bs-target", "#tasksModal");

            document.getElementById('toast').style.backgroundColor = "rgb(223, 136, 136)";
            document.getElementById('message').innerHTML = "Error! Failed to connect to Todoist!";
            var toastExample = document.getElementById('toast');
            var myToast = bootstrap.Toast.getInstance(toastExample)
            if (myToast) {
                myToast.dispose();
            }
            var toast = new bootstrap.Toast(toastExample);
            toast.show();
        }
    });
});


// Adding a task to Todoist (REST API)
document.getElementById("add").addEventListener('click', function() {
    chrome.storage.sync.get(['authToken'], function(result) {
        token = result.authToken;
        createTask(token).then(data => {
            document.getElementById("close2").click();
            document.getElementById('toast').style.backgroundColor = "rgb(172, 230, 172)";
            document.getElementById('message').innerHTML = "Success! Task added to Todoist!";
            var toastExample = document.getElementById('toast');
            var myToast = bootstrap.Toast.getInstance(toastExample)
            if (myToast) {
                myToast.dispose();
            }
            var toast = new bootstrap.Toast(toastExample)
            toast.show();
        });
    });
});
