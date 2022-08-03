const CLIENT_ID = encodeURIComponent("INSERT CLIENT ID");
const CLIENT_SECRET = encodeURIComponent("INSERT CLIENT SECRET");
const REDIRECT_URI = encodeURIComponent('INSERT OAUTH REDIRECT URL');

const authURL = "https://todoist.com/oauth/authorize";
const tokenURL = "https://todoist.com/oauth/access_token";
const SCOPE = encodeURIComponent('data:read_write');
let STATE = '';



function create_todoist_endpoint() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let oauth2_url = `${authURL}?client_id=${CLIENT_ID}&scope=${SCOPE}&state=${STATE}`;
    return oauth2_url;
}


// OAuth 2.0
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {    
    if (request.message === 'login') {
        chrome.identity.launchWebAuthFlow({
            url: create_todoist_endpoint(),
            interactive: true
        }, function(redirect_url) { 
            if ((chrome.runtime.lastError) || (redirect_url.includes('error='))) {
                sendResponse({ message: 'fail' });
            } else {
                CODE = redirect_url.substring(redirect_url.indexOf('code=') + 5);
                CODE = CODE.substring(0, CODE.indexOf('&'));
                let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);

                if (state === STATE) {
                    // Get access token
                    const init = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json'},
                        body: JSON.stringify({"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "code": CODE})
                    };

                    fetch(tokenURL, init).then(response => response.json()).then(data => {
                        if (data.hasOwnProperty('error')) {
                            sendResponse({ message: 'fail' }); 
                        } else {
                            chrome.storage.sync.set({ "authToken": data["access_token"] });
                            sendResponse({ message: 'success' });
                        }

                    }).catch(error => {
                        console.log('error', error);
                        sendResponse({ message: 'fail' });
                    });
                } else {
                    console.log('error', error);
                    sendResponse({ message: 'fail' });
                }              
            }
        });
    }
      
    return true;
});


